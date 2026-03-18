import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'
import CoachSchedule from '#models/coach_schedule'
import Customer from '#models/customer'

export default class BookingsController {

  // GET /bookings/new?courtId=X&date=Y
  async new({ request, view }: HttpContext) {
    const courtId     = request.input('courtId')
    const bookingDate = request.input('date') ?? new Date().toISOString().split('T')[0]

    const court = await Court.findOrFail(courtId)

    // หา slots ที่จองไปแล้วในวันนั้น
    const existing = await Booking.query()
      .where('court_id', courtId)
      .where('booking_date', bookingDate)
      .whereIn('booking_status', ['pending', 'confirmed'])
      .select('booking_start', 'booking_end')

    // แปลงเป็น array ของ 'HH:00' strings ที่ถูก block แล้ว
    const ALL_SLOTS = ['08','09','10','11','12','13','14','15','16','17','18','19']
    const bookedSlots: string[] = []
    for (const b of existing) {
      const startH = parseInt(b.bookingStart.split(':')[0])
      const endH   = parseInt(b.bookingEnd.split(':')[0])
      for (let h = startH; h < endH; h++) {
        const slot = String(h).padStart(2, '0') + ':00'
        if (!bookedSlots.includes(slot)) bookedSlots.push(slot)
      }
    }

    const coaches = await import('#models/coach').then(m =>
      m.default.query()
        .preload('coachPricing')
        .orderBy('coach_id', 'asc')
    )

    return view.render('pages/booking', {
      court,
      bookingDate,
      bookedSlots,
      coaches,
    })
  }

  // POST /bookings
  async store({ request, response, session }: HttpContext) {
    const {
      courtId,
      scheduleId,
      bookingDate,
      bookingStart,
      bookingEnd,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
    } = request.only([
      'courtId',
      'scheduleId',
      'bookingDate',
      'bookingStart',
      'bookingEnd',
      'customerName',
      'customerPhone',
      'customerEmail',
      'paymentMethod',
    ])

    // ── 1. Validate court ──
    const court = await Court.findOrFail(courtId)
    if (court.courtStatus !== 'open') {
      session.flash('error', 'Court is not available')
      return response.redirect().back()
    }

    // ── 2. Check conflict ──
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
      session.flash('error', 'This time slot is already booked')
      return response.redirect().back()
    }

    // ── 3. Calculate hours & price ──
    const [sh, sm] = bookingStart.split(':').map(Number)
    const [eh, em] = bookingEnd.split(':').map(Number)
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60

    const bookingCourtPrice = court.courtPricePerHr * hours
    let bookingCoachPrice   = 0

    if (scheduleId) {
      const schedule = await CoachSchedule.query()
        .where('schedule_id', scheduleId)
        .preload('coach', (q) => q.preload('coachPricing'))
        .firstOrFail()

      bookingCoachPrice = schedule.coach.coachPricing.coachPrice * hours
    }

    // ── 4. Guest: สร้าง Customer record ใหม่ (type = guest) ──
    //    Member: ดึงจาก session (ถ้า login แล้ว)
    let customerId: number | null = null
    let discount = 0

    const loggedInMemberId = session.get('memberId') as number | undefined
    if (loggedInMemberId) {
      const member = await Customer.query()
        .where('customer_id', loggedInMemberId)
        .where('customer_type', 'member')
        .preload('tier')
        .first()

      if (member) {
        customerId = member.customerId
        if (member.tier) {
          discount = member.tier.tierDiscount / 100
        }
      }
    } else {
      // Guest — สร้าง record ใหม่
      const guest = await Customer.create({
        customerName:  customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail ?? null,
        customerType:  'guest',
      })
      customerId = guest.customerId
    }

    // ── 5. Create booking ──
    const totalPrice = (bookingCourtPrice + bookingCoachPrice) * (1 - discount)

    const booking = await Booking.create({
      customerId,
      courtId,
      scheduleId:         scheduleId || null,
      bookingDate,
      bookingStart,
      bookingEnd,
      bookingCourtPrice,
      bookingCoachPrice:  bookingCoachPrice || null,
      totalPrice,
      bookingStatus:      'pending',
    })

    // ── 6. Create payment record ──
    const { default: Payment } = await import('#models/payment')
    await Payment.create({
      bookingId:     booking.bookingId,
      paymentType:   'booking',
      amount:        totalPrice,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
    })

    // ── 7. Redirect ไปหน้า confirmation ──
    return response.redirect(`/bookings/${booking.bookingId}/confirmation`)
  }

  // GET /bookings/:id/confirmation
  async confirmation({ params, view }: HttpContext) {
    const booking = await Booking.query()
      .where('booking_id', params.id)
      .preload('customer')
      .preload('court')
      .preload('coachSchedule', (q) => q.preload('coach'))
      .preload('payment')
      .firstOrFail()

    return view.render('pages/booking_confirmation', { booking })
  }

  // GET /bookings/:id (API)
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

    return response.ok({ message: 'Status updated', booking })
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
