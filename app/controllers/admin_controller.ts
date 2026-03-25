import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import Coach from '#models/coach'
import CoachPricing from '#models/coach_pricing'
import Customer from '#models/customer'
import Tier from '#models/tier'
import { DateTime } from 'luxon'

async function getTodayStats() {
  const today = DateTime.now().toISODate()!

  const allBookings = await Booking.query()
  const todayBookings = allBookings.filter((b) => String(b.bookingDate) === today)

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
    totalBookings: allBookings.length,
    pendingCount,
    confirmedCount,
    cancelledCount,
  }
}

export default class AdminController {

  async index({ view }: HttpContext) {
    const stats = await getTodayStats()

    const recentBookings = await Booking.query()
      .preload('customer')
      .preload('court')
      .preload('payment')
      .orderBy('created_at', 'desc')
      .limit(50)

    const allBookings = await Booking.query()
    const courts   = await Court.query().orderBy('court_id', 'asc')
    const coaches  = (await Coach.query().preload('coachPricing')).sort((a, b) => a.coachId - b.coachId)
    const customers = await Customer.query().preload('tier').orderBy('created_at', 'desc')
    const coachPricings = await CoachPricing.all()
    const tiers = await Tier.query().preload('members').orderBy('min_hours', 'asc')

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

    // ── bookings per day (7 วันล่าสุด) ──
    const last7: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = DateTime.now().minus({ days: i }).toISODate()!
      const count = allBookings.filter((b) => String(b.bookingDate) === d).length
      last7.push({ date: d, count })
    }

    // ── coach revenue per day (7 วันล่าสุด) ──
    const last7CoachRevenue: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = DateTime.now().minus({ days: i }).toISODate()!
      const revenue = allBookings
        .filter((b) => String(b.bookingDate) === d && b.bookingStatus !== 'cancelled')
        .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
      last7CoachRevenue.push({ date: d, revenue })
    }

    // ── coach revenue today per coach ──
    const today = DateTime.now().toISODate()!
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

    return view.render('pages/admin', {
      recentBookings,
      stats,
      courts,
      coaches,
      coachPricings,
      customers,
      tiers,
      courtRevenue,
      last7,
      last7CoachRevenue,
      coachRevenueToday,
    })
  }

  async statsJson({ response }: HttpContext) {
    const stats = await getTodayStats()
    return response.json(stats)
  }

  async createCourt({ request, response }: HttpContext) {
    const { courtName, courtPricePerHr, courtStatus } = request.only(['courtName', 'courtPricePerHr', 'courtStatus'])
    const court = await Court.create({ courtName, courtPricePerHr, courtStatus: courtStatus ?? 'available' })
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

  async updateCustomer({ params, request, response }: HttpContext) {
    const customer = await Customer.findOrFail(params.id)
    const { customerName, customerEmail, customerPhone, customerType, tierId } = request.only([
      'customerName', 'customerEmail', 'customerPhone', 'customerType', 'tierId',
    ])
    customer.merge({ customerName, customerEmail, customerPhone, customerType, tierId: tierId ?? null })
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

}
