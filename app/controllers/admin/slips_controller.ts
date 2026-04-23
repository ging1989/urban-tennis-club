import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Payment from '#models/payment'
import Customer from '#models/customer'
import Tier from '#models/tier'

export default class AdminSlipsController {

  async index({ response }: HttpContext) {
    return response.redirect('/admin?section=slips')
  }

  async verify({ params, response, session }: HttpContext) {
    const payment = await Payment.query()
      .where('payment_id', params.id)
      .preload('booking')
      .firstOrFail()

    const booking = payment.booking

    payment.paymentStatus = 'paid'
    payment.paymentTime = DateTime.now()
    await payment.save()

    booking.bookingStatus = 'confirmed'
    await booking.save()

    // อัพเดท tier ของ customer อัตโนมัติ
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

    session.flash('success', `Booking #${booking.bookingId} confirmed.`)
    return response.redirect('/admin?section=slips')
  }

  async reject({ params, response, session }: HttpContext) {
    const payment = await Payment.query()
      .where('payment_id', params.id)
      .firstOrFail()

    payment.paymentStatus = 'pending'
    payment.slipUrl = null
    await payment.save()

    session.flash('success', 'Slip rejected. Customer must re-upload.')
    return response.redirect('/admin?section=slips')
  }
}
