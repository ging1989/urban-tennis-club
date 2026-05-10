import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Coach from '#models/coach'
import Booking from '#models/booking'


export default class HomeController {
  async index({ view }: HttpContext) {
    const now = DateTime.now().setZone('Asia/Bangkok')
    const today = now.toISODate()!
    const expiryTime = now.minus({ minutes: 30 })

    const courts = await Court.query()
      .where('court_status', 'available')
      .orderBy('court_id', 'asc')

    const coaches = await Coach.query()
      .preload('coachPricing')
      .orderBy('coach_id', 'asc')

    const bookings = await Booking.query()
      .whereIn('court_id', courts.map((c) => c.courtId))
      .whereRaw('DATE(booking_date) = ?', [today])
      .where((q) => {
        q.where('booking_status', 'confirmed')
          .orWhere((inner) => {
            inner.where('booking_status', 'pending')
              .andWhere('created_at', '>', expiryTime.toSQL()!)
          })
      })

    const bookedMap: Record<number, Set<number>> = {}
    for (const b of bookings) {
      if (!bookedMap[b.courtId]) bookedMap[b.courtId] = new Set()
      const startH = parseInt(b.bookingStart.split(':')[0])
      const endH   = parseInt(b.bookingEnd.split(':')[0])
      for (let h = startH; h < endH; h++) bookedMap[b.courtId].add(h)
    }

    const bookedSlots: Record<number, Record<number, boolean>> = {}
    for (const court of courts) {
      bookedSlots[court.courtId] = {}
      for (const h of bookedMap[court.courtId] ?? []) {
        bookedSlots[court.courtId][h] = true
      }
    }

    const hours = Array.from({ length: 16 }, (_, i) => i + 7)

    const todayFormatted = now.toFormat('dd/MM/yyyy')

    return view.render('pages/home', {
      courts,
      coaches,
      today,
      bookedSlots,
      hours,
      todayFormatted,
    })
  }
}
