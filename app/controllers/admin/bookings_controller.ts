import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'

export default class AdminBookingsController {

  async index({ view }: HttpContext) {
    const bookings = await Booking.query()
      .preload('customer')
      .preload('court')
      .preload('payment')
      .orderBy('created_at', 'desc')

    const pendingCount = bookings.filter((b) => b.bookingStatus === 'pending').length

    return view.render('pages/admin/bookings/index', {
      bookings,
      pendingCount,
      currentPage: 'bookings',
      breadcrumb: 'Bookings',
    })
  }

  async updateStatus({ params, request, response, session }: HttpContext) {
    const booking = await Booking.findOrFail(params.id)
    const { status } = request.only(['status'])

    const allowed = ['pending', 'confirmed', 'cancelled']
    if (!allowed.includes(status)) {
      session.flash('error', 'Invalid status.')
      return response.redirect().back()
    }

    booking.bookingStatus = status
    await booking.save()

    session.flash('success', `Booking #${booking.bookingId} status updated to ${status}.`)
    return response.redirect().back()
  }
}
