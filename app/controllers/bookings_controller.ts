import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import CoachSchedule from '#models/coach_schedule'
import Customer from '#models/customer'


export default class BookingsController {

  async store({ request, response }: HttpContext) {
    const {
      customerId,
      courtId,
      scheduleId,
      bookingDate,
      bookingStart,
      bookingEnd,
      paymentMethod
    } = request.only ([
      'customerId',
      'courtId',
      'scheduleId',
      'bookingDate',
      'bookingStart',
      'bookingEnd',
      'paymentMethod'
    ])
    const court = await Court.findOrFail(courtId)
    if (court.courtStatus !== 'open') {
      return response.badRequest({ message: 'Court is not available' })
    }

    const conflict = await Booking.query()
      .where('court_id', courtId)
      .where('booking_date', bookingDate)
      .whereIn('booking_status', ['pending', 'confirmed'])
      .where((q) => {
        q.whereBetween('booking_start', [bookingStart, bookingEnd])
        .orWhereBetween('booking_end', [bookingStart, bookingEnd])
      })
      .first()

    if (conflict) {
      return response.conflict({ message: 'This time slot is already booked'})
    }

    const [sh, sm] = bookingStart.split(':').map(Number)
    const [eh, em] = bookingEnd.split(':').map(Number)
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60

    let bookingCourtPrice = court.courtPricePerHr * hours
    let bookingCoachPrice = 0

    if (scheduleId) {
      const schedule = await CoachSchedule.query()
        .where('schedule_id', scheduleId)
        .preload('coach', (q) => q.preload('coachPricing'))
        .firstOrFail()

      bookingCoachPrice = schedule.coach.coachPricing.coachPrice * hours
    }

    let discount = 0
    if (customerId) {
      const customer = await Customer.query()
        .where('customer_id', customerId)
        .where('customer_type', 'member')
        .preload('tier')
        .first()

      if (customer?.tier) {
        discount = customer.tier.tierDiscount / 100
      }
    }

    const totalPrice = (bookingCourtPrice + bookingCoachPrice) * (1 - discount)
    
    const booking = await Booking.create({
      customerId,
      courtId,
      scheduleId: scheduleId ?? null,
      bookingDate,
      bookingStart,
      bookingEnd,
      bookingCourtPrice,
      bookingCoachPrice: bookingCoachPrice || null,
      totalPrice,
      bookingStatus: 'pending'
    })

    return response.created({
      message: 'Booking created successfully',
      booking,
    })
  }

  async show({ params, response }: HttpContext) {
    const booking = await Booking.query()
    .where('booking_id', params.id)
    .preload('customer')
    .preload('court')
    .preload('coachSchedule', (q) => q.preload('coach'))
    .preload('payment')
    .firstOrFail()

    return response.ok(booking)
  }

  async updateStatus({ params, request, response }: HttpContext) {
    const booking = await Booking.findOrFail(params.id)
    const { status } = request.only(['status'])

    const allowed = ['pending', 'confirmed', 'cancelled']
    if (!allowed.includes(status)) {
      return response.badRequest({ message: 'Invalid status' })
    }

    booking.bookingStatus = status
    await booking.save()
    
    return response.ok({ message: 'Status updated', booking})
  }

  async byCustomer({ params, response }: HttpContext) {
    const bookings = await Booking.query()
    .where('customer_id', params.customerId)
    .preload('court')
    .preload('coachSchedule', (q) => q.preload('coach'))
    .preload('payment')
    .orderBy('booking_date', 'desc')

    return response.ok(bookings)
  }
}