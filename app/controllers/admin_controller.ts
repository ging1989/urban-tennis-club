import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import Coach from '#models/coach'
import { DateTime } from 'luxon'

export default class AdminController {

async index({ view }: HttpContext) {
    const today = DateTime.now().toISODate()
    const thisMonth = DateTime.now().startOf('month').toISODate()
 
    // ── bookings ทั้งหมด (ล่าสุด 50 รายการ) ──
    const recentBookings = await Booking.query()
      .preload('customer')
      .preload('court')
      .preload('payment')
      .orderBy('created_at', 'desc')
      .limit(50)
 
    // ── สถิติ ──
    const allBookings = await Booking.query().preload('payment')
 
    const totalRevenue = allBookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)
 
    const monthBookings = allBookings.filter(
      (b) => b.bookingDate && String(b.bookingDate) >= thisMonth!
    )
    const monthRevenue = monthBookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)
 
    const todayBookings = allBookings.filter(
      (b) => b.bookingDate && String(b.bookingDate) === today
    )
 
    const pendingCount = allBookings.filter((b) => b.bookingStatus === 'pending').length
    const confirmedCount = allBookings.filter((b) => b.bookingStatus === 'confirmed').length
    const cancelledCount = allBookings.filter((b) => b.bookingStatus === 'cancelled').length
 
    // ── courts & coaches ──
    const courts = await Court.all()
    const coaches = await Coach.query().preload('coachPricing')
 
    // ── revenue per court ──
    const courtRevenue: Record<string, number> = {}
    for (const b of allBookings) {
      if (b.bookingStatus !== 'cancelled' && b.court) {
        const name = b.court.courtName
        courtRevenue[name] = (courtRevenue[name] || 0) + (parseFloat(String(b.bookingCourtPrice)) || 0)
      }
    }
 
    // ── bookings per day (7 วันล่าสุด) ──
    const last7: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = DateTime.now().minus({ days: i }).toISODate()!
      const count = allBookings.filter((b) => String(b.bookingDate) === d).length
      last7.push({ date: d, count })
    }
 
    return view.render('pages/admin', {
      recentBookings,
      stats: {
        totalRevenue,
        monthRevenue,
        totalBookings: allBookings.length,
        todayCount: todayBookings.length,
        pendingCount,
        confirmedCount,
        cancelledCount,
      },
      courts,
      coaches,
      courtRevenue,
      last7,
    })
  }

}