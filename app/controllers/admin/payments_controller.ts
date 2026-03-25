import type { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'

export default class AdminPaymentsController {

  async index({ view }: HttpContext) {
    const payments = await Payment.query()
      .preload('booking', (q) => q.preload('customer').preload('court'))
      .orderBy('created_at', 'desc')

    const totalRevenue = payments
      .filter((p) => p.booking?.bookingStatus !== 'cancelled')
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0)

    const pendingCount = await (await import('#models/booking')).default
      .query()
      .where('booking_status', 'pending')
      .count('* as total')
      .then((r) => Number(r[0].$extras.total))

    return view.render('pages/admin/payments/index', {
      payments,
      totalRevenue,
      pendingCount,
      currentPage: 'payments',
      breadcrumb: 'Payments',
    })
  }
}
