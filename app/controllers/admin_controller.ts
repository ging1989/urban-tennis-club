import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import Coach from '#models/coach'
import Customer from '#models/customer'
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

  const pendingCount   = allBookings.filter((b) => b.bookingStatus === 'pending').length
  const confirmedCount = allBookings.filter((b) => b.bookingStatus === 'confirmed').length
  const cancelledCount = allBookings.filter((b) => b.bookingStatus === 'cancelled').length

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
    const courts   = await Court.all()
    const coaches  = await Coach.query().preload('coachPricing')
    const customers = await Customer.query().preload('tier').orderBy('created_at', 'desc')

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
      customers,
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

}
