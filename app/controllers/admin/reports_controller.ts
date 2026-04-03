import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import { DateTime } from 'luxon'

const APP_TIMEZONE = 'Asia/Bangkok'

export default class AdminReportsController {

  async index({ view, request }: HttpContext) {
    const dateFrom     = (request.input('dateFrom', '')     as string).trim()
    const dateTo       = (request.input('dateTo', '')       as string).trim()
    const courtId      = (request.input('courtId', '')      as string).trim()
    const customerType = (request.input('customerType', 'all') as string).trim()

    const courts = await Court.all()

    let bookingQuery = Booking.query()
      .preload('customer')
      .preload('court')
      .preload('payment')

    if (dateFrom) bookingQuery = bookingQuery.where('booking_date', '>=', dateFrom)
    if (dateTo)   bookingQuery = bookingQuery.where('booking_date', '<=', dateTo)
    if (courtId)  bookingQuery = bookingQuery.where('court_id', courtId)

    let allBookings = await bookingQuery

    if (customerType !== 'all') {
      allBookings = allBookings.filter((b) => b.customer?.customerType === customerType)
    }

    // ── Stats ──────────────────────────────────────────────
    const thisMonth = DateTime.now().setZone(APP_TIMEZONE).startOf('month').toISODate()!

    const totalRevenue = allBookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)

    const monthRevenue = allBookings
      .filter((b) => b.bookingStatus !== 'cancelled' && (b.bookingDate?.toISODate() ?? '') >= thisMonth)
      .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)

    const pendingCount   = allBookings.filter((b) => b.bookingStatus === 'pending').length
    const confirmedCount = allBookings.filter((b) => b.bookingStatus === 'confirmed').length
    const cancelledCount = allBookings.filter((b) => b.bookingStatus === 'cancelled').length

    // ── Revenue by court ────────────────────────────────────
    const courtRevenue: Record<string, number> = {}
    for (const b of allBookings) {
      if (b.bookingStatus !== 'cancelled' && b.court) {
        const name = b.court.courtName
        courtRevenue[name] = (courtRevenue[name] || 0) + (parseFloat(String(b.bookingCourtPrice)) || 0)
      }
    }

    // ── Monthly revenue (last 6 months) ─────────────────────
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = DateTime.now().setZone(APP_TIMEZONE).minus({ months: i })
      const monthKey = dt.toFormat('yyyy-MM')
      const label = dt.toFormat('MMM yyyy')
      const rev = allBookings
        .filter((b) => {
          if (b.bookingStatus === 'cancelled') return false
          const bDate = b.bookingDate?.toISODate() ?? ''
          return bDate >= monthKey + '-01' && bDate <= monthKey + '-31'
        })
        .reduce((sum, b) => sum + (parseFloat(String(b.totalPrice)) || 0), 0)
      monthlyRevenue.push({ month: label, revenue: rev })
    }

    // ── Last 14 days booking count ──────────────────────────
    const last14: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = DateTime.now().setZone(APP_TIMEZONE).minus({ days: i }).toISODate()!
      const count = allBookings.filter((b) => b.bookingDate?.toISODate() === d).length
      last14.push({ date: d, count })
    }

    // ── Peak hours ──────────────────────────────────────────
    const hourCounts: Record<string, number> = {}
    for (const b of allBookings) {
      if (b.bookingStatus === 'cancelled') continue
      if (b.bookingStart) {
        const h = b.bookingStart.substring(0, 2) + ':00'
        hourCounts[h] = (hourCounts[h] || 0) + 1
      }
    }
    const peakHours = Array.from({ length: 16 }, (_, i) => {
      const h = String(i + 6).padStart(2, '0') + ':00'
      return { hour: h, count: hourCounts[h] || 0 }
    })

    // ── Top customers ────────────────────────────────────────
    const custMap: Record<number, { customerName: string; bookingCount: number; totalSpent: number }> = {}
    for (const b of allBookings) {
      if (b.bookingStatus === 'cancelled' || !b.customer) continue
      const id = b.customer.customerId
      if (!custMap[id]) {
        custMap[id] = { customerName: b.customer.customerName, bookingCount: 0, totalSpent: 0 }
      }
      custMap[id].bookingCount++
      custMap[id].totalSpent += parseFloat(String(b.totalPrice)) || 0
    }
    const topCustomers = Object.values(custMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8)

    const filters = { dateFrom, dateTo, courtId, customerType }
    const hasFilter = !!(dateFrom || dateTo || courtId || customerType !== 'all')

    return view.render('pages/admin/reports/index', {
      stats: { totalRevenue, monthRevenue, totalBookings: allBookings.length, pendingCount, confirmedCount, cancelledCount },
      courts,
      courtRevenue,
      monthlyRevenue,
      last14,
      peakHours,
      topCustomers,
      bookings: allBookings,
      filters,
      hasFilter,
      currentPage: 'reports',
      reportSubPage: 'overview',
      breadcrumb: 'Reports / Overview',
      pendingCount,
    })
  }
}
