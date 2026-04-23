import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import Coach from '#models/coach'
import CoachSchedule from '#models/coach_schedule'
import CoachPricing from '#models/coach_pricing'
import Customer from '#models/customer'
import Tier from '#models/tier'
import User from '#models/user'
import { DateTime } from 'luxon'

const APP_TIMEZONE = 'Asia/Bangkok'

async function getTodayStats() {
  const today = DateTime.now().setZone(APP_TIMEZONE).toISODate()!

  const todayBookings = await Booking.query().where('booking_date', today)
  const totalBookings = await Booking.query().count('* as total').firstOrFail()

  const todayRevenue = todayBookings
    .filter((b) => b.bookingStatus !== 'cancelled')
    .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)

  const todayCoachRevenue = todayBookings
    .filter((b) => b.bookingStatus !== 'cancelled')
    .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)

  const todayCustomerIds = new Set(todayBookings.map((b) => b.customerId))

  const availableCourts = await Court.query().where('court_status', 'available')

  const pendingCount   = todayBookings.filter((b) => b.bookingStatus === 'pending').length
  const confirmedCount = todayBookings.filter((b) => b.bookingStatus === 'confirmed').length
  const cancelledCount = todayBookings.filter((b) => b.bookingStatus === 'cancelled').length

  return {
    todayBookings: todayBookings.length,
    todayRevenue,
    todayCoachRevenue,
    todayCustomers: todayCustomerIds.size,
    availableCourts: availableCourts.length,
    totalBookings: Number(totalBookings.$extras.total),
    pendingCount,
    confirmedCount,
    cancelledCount,
  }
}

async function getAdminCollections() {
  const recentBookings = await Booking.query()
    .preload('customer')
    .preload('court')
    .preload('payment')
    .orderBy('created_at', 'desc')
    .limit(50)

  const customers = await Customer.query().preload('tier').orderBy('created_at', 'desc')
  const users = await User.query().preload('customer', (q) => q.preload('tier')).orderBy('id', 'asc')

  return { recentBookings, customers, users }
}

export default class AdminController {

  async index({ view, request }: HttpContext) {
    const todayStats = await getTodayStats()
    const { recentBookings, customers, users } = await getAdminCollections()

    const allBookings = await Booking.query()
    const courts   = await Court.query().orderBy('court_id', 'asc')
    const coaches  = (await Coach.query().preload('coachPricing').preload('coachSchedules')).sort((a, b) => a.coachId - b.coachId)
    const coachPricings = await CoachPricing.all()
    const tiers = await Tier.query().preload('members').orderBy('min_hours', 'asc')
    const memberUsers = users.filter((u) => u.role === 'member')
    const slipPayments = await (await import('#models/payment')).default.query()
      .where('payment_status', 'slip_uploaded')
      .preload('booking', (q) => {
        q.preload('customer')
        q.preload('court')
      })
      .orderBy('created_at', 'asc')

    const slipHistory = await (await import('#models/payment')).default.query()
      .where('payment_status', 'paid')
      .whereNotNull('slip_url')
      .preload('booking', (q) => {
        q.preload('customer')
        q.preload('court')
      })
      .orderBy('payment_time', 'desc')
      .limit(100)
    const thisMonthStart = DateTime.now().setZone(APP_TIMEZONE).startOf('month').toISODate()!

    const totalRevenue = allBookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)

    const monthRevenue = allBookings
      .filter((b) => {
        const bookingDate = b.bookingDate?.toISODate() ?? ''
        return bookingDate >= thisMonthStart && b.bookingStatus !== 'cancelled'
      })
      .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)

    const pendingCount = allBookings.filter((b) => b.bookingStatus === 'pending').length
    const confirmedCount = allBookings.filter((b) => b.bookingStatus === 'confirmed').length
    const cancelledCount = allBookings.filter((b) => b.bookingStatus === 'cancelled').length
    const totalStatusCount = pendingCount + confirmedCount + cancelledCount
    const pendingSlipsCount = slipPayments.length
    const initialSection = request.input('section')

    const stats = {
      ...todayStats,
      totalRevenue,
      monthRevenue,
      todayCount: todayStats.todayBookings,
      pendingCount,
      confirmedCount,
      cancelledCount,
    }

    // ── revenue per court ──
    const courtRevenue: Record<string, number> = {}
    for (const b of allBookings) {
      if (b.bookingStatus !== 'cancelled') {
        const court = courts.find((c) => c.courtId === b.courtId)
        if (court) {
          courtRevenue[court.courtName] = (courtRevenue[court.courtName] || 0) + (parseFloat(String(b.bookingCourtPrice)) || 0)
        }
      }
    }
    const maxCourtRevenue = Math.max(...Object.values(courtRevenue), 1)

    // ── bookings per day (Last 7 days) ──
    const last7: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = DateTime.now().setZone(APP_TIMEZONE).minus({ days: i }).toISODate()!
      const count = allBookings.filter((b) => b.bookingDate?.toISODate() === d).length
      last7.push({ date: d, count })
    }

    // ── coach revenue per day (Last 7 days) ──
    const last7CoachRevenue: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = DateTime.now().setZone(APP_TIMEZONE).minus({ days: i }).toISODate()!
      const revenue = allBookings
        .filter((b) => b.bookingDate?.toISODate() === d && b.bookingStatus !== 'cancelled')
        .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
      last7CoachRevenue.push({ date: d, revenue })
    }

    // ── coach revenue today per coach ──
    const today = DateTime.now().setZone(APP_TIMEZONE).toISODate()!
    const todayBookingsWithSchedule = await Booking.query()
      .preload('coachSchedule')
      .where('booking_date', today)
      .whereNot('booking_status', 'cancelled')
    const coachRevenueToday: { name: string; revenue: number }[] = coaches.map((coach) => {
      const revenue = todayBookingsWithSchedule
        .filter((b) => b.coachSchedule?.coachId === coach.coachId)
        .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
      return { name: coach.coachName, revenue }
    }).filter((c) => c.revenue > 0)

    // ── Coach report: all-time stats ──
    const coachBookings = await Booking.query()
      .whereNotNull('schedule_id')
      .preload('coachSchedule', (q) => q.preload('coach'))
      .preload('customer')
      .whereNot('booking_status', 'cancelled')

    const coachStatsMap: Record<number, { coachName: string; sessions: number; revenue: number; hours: number }> = {}
    for (const b of coachBookings) {
      const coach = b.coachSchedule?.coach
      if (!coach) continue
      const id = coach.coachId
      if (!coachStatsMap[id]) coachStatsMap[id] = { coachName: coach.coachName, sessions: 0, revenue: 0, hours: 0 }
      coachStatsMap[id].sessions++
      coachStatsMap[id].revenue += parseFloat(String(b.bookingCoachPrice)) || 0
      if (b.bookingStart && b.bookingEnd) {
        const [sh, sm] = b.bookingStart.split(':').map(Number)
        const [eh, em] = b.bookingEnd.split(':').map(Number)
        coachStatsMap[id].hours += (eh * 60 + em - (sh * 60 + sm)) / 60
      }
    }
    const coachStatsAll = Object.values(coachStatsMap).sort((a, b) => b.revenue - a.revenue)

    const monthlyCoachRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = DateTime.now().setZone(APP_TIMEZONE).minus({ months: i })
      const monthKey = dt.toFormat('yyyy-MM')
      const label    = dt.toFormat('MMM yyyy')
      const rev = coachBookings
        .filter((b) => { const d = b.bookingDate?.toISODate() ?? ''; return d >= monthKey + '-01' && d <= monthKey + '-31' })
        .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
      monthlyCoachRevenue.push({ month: label, revenue: rev })
    }

    const sessionsByDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => ({
      day,
      count: coachBookings.filter((b) => b.bookingDate?.toJSDate().getDay() === i).length,
    }))

    const topCoachCustMap: Record<number, { customerName: string; sessions: number; totalSpent: number }> = {}
    for (const b of coachBookings) {
      if (!b.customer) continue
      const id = b.customer.customerId
      if (!topCoachCustMap[id]) topCoachCustMap[id] = { customerName: b.customer.customerName, sessions: 0, totalSpent: 0 }
      topCoachCustMap[id].sessions++
      topCoachCustMap[id].totalSpent += parseFloat(String(b.bookingCoachPrice)) || 0
    }
    const topCoachCustomers = Object.values(topCoachCustMap).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8)

    const totalCoachRevenueAll  = coachBookings.reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
    const monthCoachRevenueAll  = coachBookings.filter((b) => (b.bookingDate?.toISODate() ?? '') >= thisMonthStart)
      .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
    const uniqueCoachCount = new Set(coachBookings.map((b) => b.coachSchedule?.coachId).filter(Boolean)).size
    const maxCoachRev = coachStatsAll.length > 0 ? coachStatsAll[0].revenue : 1

    // ── Coach report: per-booking raw data for client-side filtering ──
    const coachBookingRawData = coachBookings.map((b) => ({
      date:      b.bookingDate?.toISODate() ?? '',
      coachId:   b.coachSchedule?.coachId ?? 0,
      coachName: b.coachSchedule?.coach?.coachName ?? 'Unknown',
      revenue:   parseFloat(String(b.bookingCoachPrice)) || 0,
      start:     b.bookingStart ?? '',
      end:       b.bookingEnd ?? '',
    }))

    // ── Customer report ──
    const customerBookings = await Booking.query()
      .whereNot('booking_status', 'cancelled')
      .preload('customer')
    const custRptMap: Record<number, {
      customerName: string; customerType: string
      courtPrice: number; coachPrice: number; total: number; bookings: number
    }> = {}
    for (const b of customerBookings) {
      if (!b.customer) continue
      const id = b.customer.customerId
      if (!custRptMap[id]) {
        custRptMap[id] = {
          customerName: b.customer.customerName,
          customerType: b.customer.customerType,
          courtPrice: 0, coachPrice: 0, total: 0, bookings: 0,
        }
      }
      custRptMap[id].courtPrice += parseFloat(String(b.bookingCourtPrice)) || 0
      custRptMap[id].coachPrice += parseFloat(String(b.bookingCoachPrice)) || 0
      custRptMap[id].total      += parseFloat(String(b.totalPrice)) || 0
      custRptMap[id].bookings++
    }
    const customerReportData = Object.values(custRptMap).sort((a, b) => b.total - a.total)

    // ── Court report: per-booking data for client-side filtering ──
    const courtBookingData = allBookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .map((b) => {
        const court = courts.find((c) => c.courtId === b.courtId)
        return {
          date:      b.bookingDate?.toISODate() ?? '',
          courtId:   court?.courtId ?? 0,
          courtName: court?.courtName ?? 'Unknown',
          revenue:   parseFloat(String(b.bookingCourtPrice)) || 0,
        }
      })

    return view.render('pages/admin', {
      recentBookings,
      stats,
      courts,
      coaches,
      coachPricings,
      customers,
      tiers,
      users,
      memberUsers,
      slipPayments,
      slipHistory,
      courtRevenue,
      maxCourtRevenue,
      totalStatusCount,
      pendingSlipsCount,
      initialSection,
      last7,
      last7CoachRevenue,
      coachRevenueToday,
      coachStatsAll,
      monthlyCoachRevenue,
      sessionsByDay,
      topCoachCustomers,
      totalCoachRevenueAll,
      monthCoachRevenueAll,
      uniqueCoachCount,
      maxCoachRev,
      coachBookingRawData,
      courtBookingData,
      customerReportData,
    })
  }

  async statsJson({ response }: HttpContext) {
    const stats = await getTodayStats()
    return response.json(stats)
  }

  async dataJson({ response }: HttpContext) {
    const { recentBookings, customers, users } = await getAdminCollections()
    return response.json({ recentBookings, customers, users })
  }

  async createCourt({ request, response }: HttpContext) {
    const { courtName, courtPricePerHr, courtStatus } = request.only(
      ['courtName', 'courtPricePerHr', 'courtStatus'])
    const court = await Court.create(
      { courtName, courtPricePerHr, courtStatus: courtStatus ?? 'available' })
    return response.json(court)
  }

  async updateCourt({ params, request, response }: HttpContext) {
    const court = await Court.findOrFail(params.id)
    const { courtName, courtPricePerHr, courtStatus } = request.only(['courtName', 'courtPricePerHr', 'courtStatus'])
    court.merge({ courtName, courtPricePerHr, courtStatus })
    await court.save()
    return response.json(court)
  }

  async deleteCourt({ params, response }: HttpContext) {
    const court = await Court.findOrFail(params.id)
    try {
      await court.delete()
      return response.json({ message: 'Court deleted' })
    } catch {
      return response.status(409).json({ message: 'Cannot delete court: it has existing bookings.' })
    }
  }

  async createCoach({ request, response }: HttpContext) {
    const { coachName, coachLevelId, coachStatus } = request.only(['coachName', 'coachLevelId', 'coachStatus'])
    const coach = await Coach.create({ coachName, coachLevelId, coachStatus: coachStatus ?? 'available' })
    return response.json(coach)
  }

  async updateCoach({ params, request, response }: HttpContext) {
    const coach = await Coach.findOrFail(params.id)
    const { coachName, coachLevelId, coachStatus } = request.only(['coachName', 'coachLevelId', 'coachStatus'])
    coach.merge({ coachName, coachLevelId, coachStatus })
    await coach.save()
    return response.json(coach)
  }

  async upsertCoachSchedule({ params, request, response }: HttpContext) {
    // params.coachId, body: { dayOfWeek, startTime, endTime }
    const { dayOfWeek, startTime, endTime } = request.only(['dayOfWeek', 'startTime', 'endTime'])
    const existing = await CoachSchedule.query()
      .where('coach_id', params.coachId)
      .where('avail_date', dayOfWeek)
      .first()
    if (existing) {
      existing.merge({ startTime, endTime })
      await existing.save()
      return response.json(existing)
    }
    const schedule = await CoachSchedule.create({ coachId: params.coachId, dayOfWeek, startTime, endTime })
    return response.json(schedule)
  }

  async deleteCoachSchedule({ params, response }: HttpContext) {
    // params.coachId, params.day
    const schedule = await CoachSchedule.query()
      .where('coach_id', params.coachId)
      .where('avail_date', params.day)
      .firstOrFail()
    await schedule.delete()
    return response.json({ message: 'Schedule removed' })
  }

  async updateCustomer({ params, request, response }: HttpContext) {
    const customer = await Customer.findOrFail(params.id)
    const { customerName, customerEmail, customerPhone, customerType, tierId, userId } = request.only([
      'customerName', 'customerEmail', 'customerPhone', 'customerType', 'tierId', 'userId',
    ])
    customer.merge({
      customerName,
      customerEmail: customerEmail ?? null,
      customerPhone: customerPhone ?? '',
      customerType,
      tierId: tierId ?? null,
      userId: customerType === 'member' ? (userId ?? null) : null,
    })
    await customer.save()
    return response.json(customer)
  }

  async createTier({ request, response }: HttpContext) {
    const { tierDesc, minHours, tierDiscount } = request.only(['tierDesc', 'minHours', 'tierDiscount'])
    const tier = await Tier.create({ tierDesc, minHours, tierDiscount })
    return response.json(tier)
  }

  async updateTier({ params, request, response }: HttpContext) {
    const tier = await Tier.findOrFail(params.id)
    const { tierDesc, minHours, tierDiscount } = request.only(['tierDesc', 'minHours', 'tierDiscount'])
    tier.merge({ tierDesc, minHours, tierDiscount })
    await tier.save()
    return response.json(tier)
  }

  async deleteTier({ params, response }: HttpContext) {
    const tier = await Tier.findOrFail(params.id)
    try {
      await tier.delete()
      return response.json({ message: 'Tier deleted' })
    } catch {
      return response.status(409).json({ message: 'Cannot delete tier: it has members assigned.' })
    }
  }

  async createUser({ request, response }: HttpContext) {
    const { fullName, username, email, password, role } = request.only(['fullName', 'username', 'email', 'password', 'role'])
    const existing = await User.findBy('email', email)
    if (existing) return response.status(409).json({ message: 'Email already in use.' })
    const user = await User.create({ fullName: fullName ?? null, username: username ?? null, email, password, role: role ?? 'member' })

    if (user.role === 'member') {
      const defaultTier = await Tier.query().where('min_hours', 0).first()
      await Customer.create({
        customerName: user.fullName ?? user.username ?? user.email,
        customerEmail: user.email,
        customerPhone: '',
        customerType: 'member',
        userId: user.id,
        tierId: defaultTier?.tierId ?? null,
      })
    }

    return response.json(user)
  }

  async updateUser({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const { fullName, username, email, password, role } = request.only(['fullName', 'username', 'email', 'password', 'role'])
    user.merge({ fullName: fullName ?? null, username: username ?? null, email, role })
    if (password) user.password = password
    await user.save()

    let customer = await Customer.query().where('user_id', user.id).first()

    if (user.role === 'member') {
      if (!customer) {
        const defaultTier = await Tier.query().where('min_hours', 0).first()
        customer = await Customer.create({
          customerName: user.fullName ?? user.username ?? user.email,
          customerEmail: user.email,
          customerPhone: '',
          customerType: 'member',
          userId: user.id,
          tierId: defaultTier?.tierId ?? null,
        })
      } else {
        customer.merge({
          customerName: user.fullName ?? user.username ?? user.email,
          customerEmail: user.email,
          customerType: 'member',
        })
        await customer.save()
      }
    }

    return response.json(user)
  }

  async deleteUser({ params, auth, response }: HttpContext) {
    if (auth.user!.id === Number(params.id)) {
      return response.status(400).json({ message: 'Cannot delete your own account.' })
    }
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.json({ message: 'User deleted' })
  }

}
