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
    const { bookingId, paymentMethod, amount } = request.only([
      'bookingId',
      'paymentMethod',
      'amount',
    ])

    // เช็คว่า booking มีอยู่จริง
    const booking = await Booking.findOrFail(bookingId)

    // เช็คว่ายังไม่ได้จ่ายไปแล้ว
    const existing = await Payment.findBy('booking_id', bookingId)
    if (existing) {
      return response.conflict({ message: 'Payment already exists for this booking' })
    }

    const payment = await Payment.create({
      bookingId,
      paymentType: 'total',
      amount,
      paymentMethod,
      paymentStatus: 'paid',
      paymentTime: DateTime.now()
    })

    // อัปเดต booking status เป็น confirmed
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

    return response.created({
      message: 'Payment recorded successfully',
      payment,
    })
  }

  /**
   * POST /bookings/:bookingId/slip
   * อัพโหลดสลิปการชำระเงิน
   */
  async uploadSlip({ params, request, response, session }: HttpContext) {
    const payment = await Payment.query().where('booking_id', params.bookingId).firstOrFail()

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

    const filename = `slip_${params.bookingId}_${Date.now()}.${slip.extname}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'slips')
    await slip.move(uploadDir, { name: filename })

    if (slip.state !== 'moved') {
      session.flash('error', 'Failed to save file. Please try again.')
      return response.redirect().back()
    }

    payment.slipUrl = `/uploads/slips/${filename}`
    payment.paymentStatus = 'slip_uploaded'
    await payment.save()

    return response.redirect(`/bookings/${params.bookingId}/confirmation`)
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