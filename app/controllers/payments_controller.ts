import type { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'
import Booking from '#models/booking'
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

    return response.created({
      message: 'Payment recorded successfully',
      payment,
    })
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