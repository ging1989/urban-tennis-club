import { DateTime } from 'luxon'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Booking from '#models/booking'
import Court from '#models/court'
import CoachSchedule from '#models/coach_schedule'
import Customer from '#models/customer'
import Coach from '#models/coach'
import Payment from '#models/payment'

export default class BookingsController {

  /**
   * แสดงหน้าฟอร์มจองสนาม
   */
  // app/controllers/bookings_controller.ts

async new({ request, view, session, response }: HttpContext) { // ✅ เพิ่ม response เข้ามา
  const courtId = request.input('courtId')
  
  // 1. ตรวจสอบ courtId: ถ้าไม่มี ให้กลับไปเลือกสนาม
  if (!courtId) {
    return response.redirect().toPath('/courts')
  }

  // 2. จัดการเรื่องวันที่: รองรับทั้งกรณีไม่มีค่า หรือเป็น String "null"
  let bookingDate = request.input('date')
  if (!bookingDate || bookingDate === 'null') {
    bookingDate = DateTime.now().toISODate()
  }

  const court = await Court.findOrFail(courtId)

  // 3. ระบบ 30 นาที: คำนวณเวลาถอยหลังเพื่อกรองสล็อตที่จองค้างไว้
  const expiryTime = DateTime.now().minus({ minutes: 30 }).toSQL()

  const existing = await Booking.query()
    .where('court_id', courtId)
    .where('booking_date', bookingDate)
    .where((q) => {
      q.where('booking_status', 'confirmed')
        .orWhere((inner) => {
          inner.where('booking_status', 'pending')
               .andWhere('created_at', '>', expiryTime)
        })
    })
    .select('booking_start', 'booking_end')

  // ... (ส่วนการสร้าง bookedSlots เหมือนเดิม) ...
  const bookedSlots: string[] = []
  for (const b of existing) {
    const startH = parseInt(b.bookingStart.split(':')[0])
    const endH   = parseInt(b.bookingEnd.split(':')[0])
    for (let h = startH; h < endH; h++) {
      const slot = String(h).padStart(2, '0') + ':00'
      if (!bookedSlots.includes(slot)) bookedSlots.push(slot)
    }
  }

  const coaches = await Coach.query().preload('coachPricing').orderBy('coach_id', 'asc')

  let discount = 0
  const loggedInMemberId = session.get('memberId')
  if (loggedInMemberId) {
    const member = await Customer.query().where('customer_id', loggedInMemberId).preload('tier').first()
    if (member?.tier) discount = member.tier.tierDiscount
  }

  return view.render('pages/booking', {
    court,
    bookingDate,
    bookedSlots,
    coaches,
    discount,
  })
}
  /**
   * บันทึกการจอง (พร้อมระบบ Transaction)
   */
async store({ request, response, session }: HttpContext) {
    const data = request.only([
      'courtId', 'scheduleId', 'bookingDate',
      'bookingStart', 'bookingEnd', 'customerName',
      'customerPhone', 'customerEmail', 'paymentMethod',
    ])

    // ✅ สร้าง URL สำหรับส่งกลับกรณีเกิดข้อผิดพลาด เพื่อป้องกันการหลุดไปหน้า /courts
    const redirectUrl = `/bookings/new?courtId=${data.courtId}&date=${data.bookingDate}`

    const court = await Court.findOrFail(data.courtId)
    if (court.courtStatus !== 'open' && court.courtStatus !== 'available' && court.courtStatus !== 'indoor') {
      session.flash('error', 'สนามไม่เปิดให้บริการในขณะนี้')
      return response.redirect().toPath(redirectUrl)
    }

    const trx = await db.transaction()

    try {
      // 1. ตรวจสอบการจองซ้ำ (พิจารณารายการที่รอชำระเงินภายใน 30 นาทีด้วย)
      const expiryTime = DateTime.now().minus({ minutes: 30 }).toSQL()

      const conflict = await Booking.query({ client: trx })
        .where('court_id', data.courtId)
        .where('booking_date', data.bookingDate)
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
        session.flash('error', 'ช่วงเวลานี้มีผู้จองไปแล้ว (หรือมีคนจองไว้และกำลังรอการชำระเงิน)')
        return response.redirect().toPath(redirectUrl)
      }

      // 2. คำนวณราคาและส่วนลด
      const [sh, sm] = data.bookingStart.split(':').map(Number)
      const [eh, em] = data.bookingEnd.split(':').map(Number)
      const hours = (eh * 60 + em - (sh * 60 + sm)) / 60

      let customerId: number
      let discount = 0

      // กรณีสมาชิก (ได้รับส่วนลดตาม Tier)
      const loggedInMemberId = session.get('memberId')
      if (loggedInMemberId) {
        const member = await Customer.query({ client: trx })
          .where('customer_id', loggedInMemberId)
          .preload('tier')
          .firstOrFail()
        customerId = member.customerId
        discount = member.tier ? member.tier.tierDiscount / 100 : 0
      } else {
        // กรณี Guest
        const guest = await Customer.create({
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          customerType: 'guest',
        }, { client: trx })
        customerId = guest.customerId
      }

      const courtPrice = court.courtPricePerHr * hours
      let coachPrice = 0

      if (data.scheduleId) {
        const schedule = await CoachSchedule.query({ client: trx })
          .where('schedule_id', data.scheduleId)
          .preload('coach', (q) => q.preload('coachPricing'))
          .firstOrFail()
        coachPrice = schedule.coach.coachPricing.coachPrice * hours
      }

      const totalPrice = (courtPrice + coachPrice) * (1 - discount)

      // 3. สร้างรายการจอง (สถานะเป็น pending เพื่อรอชำระเงิน)
      const booking = await Booking.create({
        customerId,
        courtId: data.courtId,
        scheduleId: data.scheduleId || null,
        bookingDate: data.bookingDate,
        bookingStart: data.bookingStart,
        bookingEnd: data.bookingEnd,
        bookingCourtPrice: courtPrice,
        bookingCoachPrice: coachPrice || null,
        totalPrice,
        bookingStatus: 'pending',
      }, { client: trx })

      // 4. สร้างรายการชำระเงิน
      await Payment.create({
        bookingId: booking.bookingId,
        paymentType: 'booking',
        amount: totalPrice,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending',
      }, { client: trx })

      await trx.commit()
      return response.redirect(`/bookings/${booking.bookingId}/confirmation`)

    } catch (error) {
      // ยกเลิก Transaction หากเกิดข้อผิดพลาด
      if (typeof trx !== 'undefined') await trx.rollback()
      
      console.error('Booking Error:', error)
      session.flash('error', 'เกิดข้อผิดพลาด: ' + error.message)
      
      // ✅ ส่งกลับไปยังหน้าจองพร้อม Parameter เดิม เพื่อให้ Controller หน้าเดิมทำงานต่อได้
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