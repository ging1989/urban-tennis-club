import type { HttpContext } from '@adonisjs/core/http'
import { join } from 'node:path'
import Payment from '#models/payment'
import Booking from '#models/booking'
import Customer from '#models/customer'
import Tier from '#models/tier'
import { DateTime } from 'luxon'

export default class PaymentsController {
  /**
   * POST /payments
   * บันทึกการชำระเงิน
   */
  async store({ request, response }: HttpContext) {
    const { bookingId, paymentMethod } = request.only(['bookingId', 'paymentMethod'])

    const booking = await Booking.findOrFail(bookingId)

    if (booking.bookingStatus === 'confirmed') {
      return response.conflict({ message: 'Booking is already confirmed' })
    }

    if (booking.bookingStatus === 'cancelled') {
      return response.conflict({ message: 'Cannot pay for a cancelled booking' })
    }

    const payment = await Payment.query().where('booking_id', bookingId).first()

    if (!payment) {
      return response.notFound({ message: 'Payment record not found for this booking' })
    }

    if (payment.paymentStatus === 'paid') {
      return response.conflict({ message: 'Payment already recorded for this booking' })
    }

    if (paymentMethod) payment.paymentMethod = paymentMethod
    payment.paymentStatus = 'paid'
    payment.paymentTime = DateTime.now()
    await payment.save()

    booking.bookingStatus = 'confirmed'
    await booking.save()

    // อัปเดต tier ของ customer อัตโนมัติ
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

    return response.ok({
      message: 'Payment recorded successfully',
      payment,
    })
  }

  /**
   * POST /bookings/:bookingId/slip
   * อัพโหลดสลิปการชำระเงิน
   */
  async uploadSlip({ params, request, response, session }: HttpContext) {
    const booking = await Booking.query().where('booking_number', params.bookingNumber).firstOrFail()
    const payment = await Payment.query().where('booking_id', booking.bookingId).firstOrFail()

    const slip = request.file('slip', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf'],
    })

    if (!slip) {
      session.flash('error', 'Please select a file.')
      return response.redirect().back()
    }

    if (!slip.isValid) {
      session.flash('error', slip.errors[0]?.message ?? 'Invalid file. Use JPG, PNG or PDF under 5MB.')
      return response.redirect().back()
    }

    const filename = `slip_${booking.bookingId}_${Date.now()}.${slip.extname}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'slips')
    await slip.move(uploadDir, { name: filename })

    if (slip.state !== 'moved') {
      session.flash('error', 'Failed to save file. Please try again.')
      return response.redirect().back()
    }

    payment.slipUrl = `/uploads/slips/${filename}`
    payment.paymentStatus = 'slip_uploaded'
    await payment.save()

    return response.redirect(`/bookings/${booking.bookingNumber}/confirmation`)
  }

  /**
   * GET /payments/:bookingId
   * ดูรายละเอียดการชำระเงินของ booking
   */
  async show({ params, response }: HttpContext) {
    const payment = await Payment.query()
      .where('booking_id', params.bookingId)
      .preload('booking')
      .firstOrFail()

    return response.ok(payment)
  }
}