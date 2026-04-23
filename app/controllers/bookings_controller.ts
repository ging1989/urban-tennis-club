import { DateTime } from 'luxon'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Booking from '#models/booking'
import Court from '#models/court'
import CoachSchedule from '#models/coach_schedule'
import Customer from '#models/customer'
import Coach from '#models/coach'
import Payment from '#models/payment'
import Tier from '#models/tier'

export default class BookingsController {

  /**
   * แสดงหน้าฟอร์มจองสนาม
   */
  // app/controllers/bookings_controller.ts

// app/controllers/bookings_controller.ts

async new({ request, view, response, auth }: HttpContext) {
    const courtId = request.input('courtId')
    if (!courtId) return response.redirect().toPath('/courts')

    const rawBookingDate = request.input('date')
    const bookingDate = rawBookingDate && rawBookingDate !== 'null' ? rawBookingDate : ''

    try {
      const court = await Court.findOrFail(courtId)
      const expiryTime = DateTime.now().setZone('Asia/Bangkok').minus({ minutes: 30 })

      const bookedSlots: string[] = []
      if (bookingDate) {
        const existing = await Booking.query()
          .where('court_id', courtId)
          .whereRaw('DATE(booking_date) = ?', [bookingDate])
          .where((q) => {
            q.where('booking_status', 'confirmed')
              .orWhere((inner) => {
                inner.where('booking_status', 'pending')
                     .andWhere('created_at', '>', expiryTime.toSQL())
              })
          })

        for (const b of existing) {
          if (b.bookingStart && b.bookingEnd) {
            const startH = parseInt(b.bookingStart.split(':')[0])
            const endH   = parseInt(b.bookingEnd.split(':')[0])
            for (let h = startH; h < endH; h++) {
              bookedSlots.push(String(h).padStart(2, '0') + ':00')
            }
          }
        }
      }

      const coaches = await Coach.query().preload('coachPricing').orderBy('coach_id', 'asc')
      const memberProfile = auth.user && auth.user.role === 'member'
        ? await Customer.query().where('user_id', auth.user.id).preload('tier').first()
        : null

      return view.render('pages/booking', {
        court,
        bookingDate,
        bookedSlotsJson: JSON.stringify(bookedSlots), 
        minDate: DateTime.now().setZone('Asia/Bangkok').toISODate(),
        coaches,
        discount: memberProfile?.tier ? memberProfile.tier.tierDiscount : 0,
        user: auth.user,
        memberProfile,
      })

    } catch (error) {
      console.error('New Booking Error:', error)
      return response.redirect().toPath('/courts')
    }
  }
  /**
   * บันทึกการจอง (พร้อมระบบ Transaction)
   */
  async store({ request, response, session, auth }: HttpContext) {
      const data = request.only([
        'courtId', 'coachId', 'bookingDate',
        'bookingStart', 'bookingEnd', 'customerName',
        'customerPhone', 'customerEmail', 'paymentMethod',
      ])

      const redirectUrl = `/bookings/new?courtId=${data.courtId}&date=${data.bookingDate}`

      if (!data.bookingDate) {
        session.flash('error', 'Please select the play date before booking.')
        return response.redirect().toPath(`/bookings/new?courtId=${data.courtId}`)
      }

      const court = await Court.findOrFail(data.courtId)
      
      // แก้ไขเงื่อนไข Status ให้ถูกต้อง
      const activeStatus = ['available', 'open', 'indoor', 'outdoor']
      if (!activeStatus.includes(court.courtStatus)) {
        session.flash('error', 'The court is not available at the moment.')
        return response.redirect().toPath(redirectUrl)
      }

      const trx = await db.transaction()

      try {

        const expiryTime = DateTime.now().minus({ minutes: 30 }).toJSDate()

        const conflict = await Booking.query({ client: trx })
          .where('court_id', data.courtId)
          .whereRaw('DATE(booking_date) = ?', [data.bookingDate])
          .where((q) => {
            q.where('booking_status', 'confirmed')
              .orWhere((inner) => {
                inner.where('booking_status', 'pending')
                    .andWhere('created_at', '>', expiryTime)
              })
          })
          .where((q) => {
            q.where('booking_start', '<', data.bookingEnd)
            .andWhere('booking_end', '>', data.bookingStart)
          })
          .first()

        if (conflict) {
          await trx.rollback()
          session.flash('error', 'This time slot has already been booked or is pending payment.')
          return response.redirect().toPath(redirectUrl)
        }

        // --- (ส่วนคำนวณราคาและบันทึกข้อมูลคงเดิม) ---
        
        const [sh, sm] = data.bookingStart.split(':').map(Number)
        const [eh, em] = data.bookingEnd.split(':').map(Number)
        const hours = (eh * 60 + em - (sh * 60 + sm)) / 60

        let customerId: number
        let discount = 0
        if (auth.user && auth.user.role === 'member') {
          const member = await Customer.query({ client: trx })
            .where('user_id', auth.user.id)
            .preload('tier')
            .firstOrFail()

          const nextPhone = String(data.customerPhone || '').trim()
          if (nextPhone && nextPhone !== member.customerPhone) {
            member.customerPhone = nextPhone
            await member.save()
          }

          customerId = member.customerId
          discount = member.tier ? member.tier.tierDiscount / 100 : 0
        } else {
          // Logic: ค้นหาลูกค้าเดิมจากตาราง customers โดยใช้ customer_phone หรือ customer_email
          let guest = await Customer.query({ client: trx })
            .where((q) => {
              q.where('customer_phone', data.customerPhone)
              if (data.customerEmail) q.orWhere('customer_email', data.customerEmail)
            }).first()

          // Decision: ถ้าไม่เจอ (New) ให้ทำการ INSERT ใหม่
          if (!guest) {
            guest = await Customer.create({ customerName: data.customerName, customerPhone: data.customerPhone, 
              customerEmail: data.customerEmail || null, customerType: 'guest' }, { client: trx })
          } else {
            let isUpdated = false
            if (data.customerName && guest.customerName !== data.customerName) {
              guest.customerName = data.customerName
              isUpdated = true
            }
            if (data.customerEmail && guest.customerEmail !== data.customerEmail) {
              guest.customerEmail = data.customerEmail
              isUpdated = true
            }
            
            if (isUpdated) await guest.save()
          }
          customerId = guest.customerId
        }

        const courtPrice = court.courtPricePerHr * hours
        let coachPrice = 0
        let scheduleId: number | null = null
        if (data.coachId) {
          const dayOfWeek = DateTime.fromISO(data.bookingDate).weekday % 7
          const schedule = await CoachSchedule.query({ client: trx })
            .where('coach_id', data.coachId)
            .where('avail_date', dayOfWeek)
            .preload('coach', (q) => q.preload('coachPricing'))
            .firstOrFail()
          scheduleId = schedule.scheduleId
          coachPrice = schedule.coach.coachPricing.coachPrice * hours
        }
        const totalPrice = (courtPrice + coachPrice) * (1 - discount)

        const datePrefix = DateTime.fromISO(data.bookingDate).toFormat('yyMMdd')
        let bookingNumber: string
        do {
          const rand = String(Math.floor(Math.random() * 9000) + 1000)
          bookingNumber = datePrefix + rand
        } while (await Booking.query({ client: trx }).where('booking_number', bookingNumber).first())

        const booking = await Booking.create({ customerId, courtId: data.courtId, scheduleId,
          bookingNumber,
          bookingDate: data.bookingDate, bookingStart: data.bookingStart, bookingEnd: data.bookingEnd,
          bookingCourtPrice: courtPrice, bookingCoachPrice: coachPrice || null, totalPrice, bookingStatus: 'pending' }, { client: trx })

        await Payment.create({ bookingId: booking.bookingId, paymentType: 'booking', amount: totalPrice, 
          paymentMethod: data.paymentMethod, paymentStatus: 'pending' }, { client: trx })

        await trx.commit()
        return response.redirect(`/bookings/${booking.bookingId}/confirmation`)

      } catch (error) {
        if (typeof trx !== 'undefined') await trx.rollback()
        console.error('Booking Error:', error)
        session.flash('error', 'Error: ' + error.message)
        return response.redirect().toPath(redirectUrl)
      }
    }

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

  async checkPaymentStatus({ params, response }: HttpContext) {
    const booking = await Booking.query()
      .where('booking_id', params.id)
      .preload('payment')
      .firstOrFail()

    return response.json({
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.payment?.paymentStatus ?? null,
    })
  }

  async statusForm({ view }: HttpContext) {
    return view.render('pages/booking_status')
  }

  async statusLookup({ request, view }: HttpContext) {
    const { bookingId, phone } = request.only(['bookingId', 'phone'])

    if (!bookingId || !phone) {
      return view.render('pages/booking_status', {
        error: 'Please fill in both Booking ID and phone number.',
        input: { bookingId, phone },
      })
    }

    const booking = await Booking.query()
      .where((q) => {
        q.where('booking_number', bookingId).orWhere('booking_id', isNaN(Number(bookingId)) ? -1 : Number(bookingId))
      })
      .preload('customer')
      .preload('court')
      .preload('coachSchedule', (q) => q.preload('coach'))
      .preload('payment')
      .first()

    if (!booking || booking.customer.customerPhone !== phone.trim()) {
      return view.render('pages/booking_status', {
        error: 'Booking not found. Please check your Booking ID and phone number.',
        input: { bookingId, phone },
      })
    }

    return view.render('pages/booking_status', { booking })
  }
}
