import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Customer from '#models/customer'
import Tier from '#models/tier'

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

    if (status === 'confirmed' && booking.customerId) {
      const customer = await Customer.query()
        .where('customer_id', booking.customerId)
        .preload('booking')
        .first()

      if (customer) {
        const totalHours = customer.booking
          .filter((b) => b.bookingStatus === 'confirmed')
          .reduce((sum, b) => {
            const [sh, sm] = b.bookingStart.split(':').map(Number)
            const [eh, em] = b.bookingEnd.split(':').map(Number)
            return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
          }, 0)

        const tiers = await Tier.query().orderBy('min_hours', 'desc')
        const newTier = tiers.find((t) => totalHours >= t.minHours)

        if (newTier && newTier.tierId !== customer.tierId) {
          customer.tierId = newTier.tierId
          await customer.save()
        }
      }
    }

    session.flash('success', `Booking #${booking.bookingId} status updated to ${status}.`)
    return response.redirect().back()
  }
}
