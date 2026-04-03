import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Coach from '#models/coach'
import { DateTime } from 'luxon'

const APP_TIMEZONE = 'Asia/Bangkok'

export default class AdminCoachReportsController {

  async index({ view, request }: HttpContext) {
    const dateFrom = (request.input('dateFrom', '') as string).trim()
    const dateTo   = (request.input('dateTo', '')   as string).trim()
    const coachId  = (request.input('coachId', '')  as string).trim()

    const coaches = await Coach.query().preload('coachPricing')

    // bookings that have a coach session
    let bookingQuery = Booking.query()
      .whereNotNull('schedule_id')
      .preload('customer')
      .preload('court')
      .preload('coachSchedule', (q) => q.preload('coach', (c) => c.preload('coachPricing')))

    if (dateFrom) bookingQuery = bookingQuery.where('booking_date', '>=', dateFrom)
    if (dateTo)   bookingQuery = bookingQuery.where('booking_date', '<=', dateTo)

    let allBookings = await bookingQuery

    if (coachId) {
      allBookings = allBookings.filter((b) => String(b.coachSchedule?.coachId) === coachId)
    }

    const activeBookings = allBookings.filter((b) => b.bookingStatus !== 'cancelled')

    // ── Stats ──────────────────────────────────────────────
    const thisMonth = DateTime.now().setZone(APP_TIMEZONE).startOf('month').toISODate()!

    const totalCoachRevenue = activeBookings
      .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)

    const monthCoachRevenue = activeBookings
      .filter((b) => (b.bookingDate?.toISODate() ?? '') >= thisMonth)
      .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)

    const totalSessions  = activeBookings.length
    const uniqueCoaches  = new Set(activeBookings.map((b) => b.coachSchedule?.coachId).filter(Boolean)).size
    const cancelledCount = allBookings.filter((b) => b.bookingStatus === 'cancelled').length

    // ── Revenue & stats per coach ───────────────────────────
    const coachMap: Record<
      number,
      { coachName: string; sessions: number; revenue: number; hours: number }
    > = {}

    for (const b of activeBookings) {
      const coach = b.coachSchedule?.coach
      if (!coach) continue
      const id = coach.coachId
      if (!coachMap[id]) {
        coachMap[id] = { coachName: coach.coachName, sessions: 0, revenue: 0, hours: 0 }
      }
      coachMap[id].sessions++
      coachMap[id].revenue += parseFloat(String(b.bookingCoachPrice)) || 0
      if (b.bookingStart && b.bookingEnd) {
        const [sh, sm] = b.bookingStart.split(':').map(Number)
        const [eh, em] = b.bookingEnd.split(':').map(Number)
        coachMap[id].hours += (eh * 60 + em - (sh * 60 + sm)) / 60
      }
    }
    const coachStats = Object.values(coachMap).sort((a, b) => b.revenue - a.revenue)

    // ── Monthly coach revenue (last 6 months) ───────────────
    const monthlyCoachRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = DateTime.now().setZone(APP_TIMEZONE).minus({ months: i })
      const monthKey = dt.toFormat('yyyy-MM')
      const label    = dt.toFormat('MMM yyyy')
      const rev = activeBookings
        .filter((b) => {
          const bDate = b.bookingDate?.toISODate() ?? ''
          return bDate >= monthKey + '-01' && bDate <= monthKey + '-31'
        })
        .reduce((sum, b) => sum + (parseFloat(String(b.bookingCoachPrice)) || 0), 0)
      monthlyCoachRevenue.push({ month: label, revenue: rev })
    }

    // ── Sessions by day of week ──────────────────────────────
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayCount  = Array(7).fill(0)
    for (const b of activeBookings) {
      if (b.bookingDate) {
        dayCount[b.bookingDate.toJSDate().getDay()]++
      }
    }
    const sessionsByDay = dayLabels.map((day, i) => ({ day, count: dayCount[i] }))

    // ── Top customers using coaches ──────────────────────────
    const custMap: Record<
      number,
      { customerName: string; sessions: number; totalSpent: number }
    > = {}
    for (const b of activeBookings) {
      if (!b.customer) continue
      const id = b.customer.customerId
      if (!custMap[id]) {
        custMap[id] = { customerName: b.customer.customerName, sessions: 0, totalSpent: 0 }
      }
      custMap[id].sessions++
      custMap[id].totalSpent += parseFloat(String(b.bookingCoachPrice)) || 0
    }
    const topCoachCustomers = Object.values(custMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8)

    // ── Nav badge: total pending bookings (all, not just coach) ─
    const pendingAll = await Booking.query().where('booking_status', 'pending')
    const pendingCount = pendingAll.length

    const filters   = { dateFrom, dateTo, coachId }
    const hasFilter = !!(dateFrom || dateTo || coachId)

    return view.render('pages/admin/reports/coaches', {
      stats: { totalCoachRevenue, monthCoachRevenue, totalSessions, uniqueCoaches, cancelledCount },
      coaches,
      coachStats,
      monthlyCoachRevenue,
      sessionsByDay,
      topCoachCustomers,
      filters,
      hasFilter,
      currentPage: 'reports',
      reportSubPage: 'coaches',
      breadcrumb: 'Reports / Coach',
      pendingCount,
    })
  }
}
