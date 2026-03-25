import type { HttpContext } from '@adonisjs/core/http'
import Coach from '#models/coach'
import CoachSchedule from '#models/coach_schedule'
import Booking from '#models/booking'
import { DateTime } from 'luxon'

export default class CoachesController {

  async index({ view }: HttpContext) {
    const coaches = await Coach.query()
      .preload('coachPricing')
      .orderBy('coach_id', 'asc')

    return view.render('pages/coaches', { coaches })
  }

  async show({ params, response }: HttpContext) {
    const coach = await Coach.query()
      .where('coach_id', params.id)
      .preload('coachPricing')
      .firstOrFail()

    return response.ok(coach)
  }

  async schedules({ params, request, response }: HttpContext) {
    const date = request.input('date')

    if (!date) {
      return response.badRequest({ message: 'date is required' })
    }

    const schedules = await CoachSchedule.query()
      .where('coach_id', params.id)
      .where('avail_date', date)
      .preload('coach', (q) => q.preload('coachPricing'))

    return response.ok(schedules)
  }

  async busy({ request, response }: HttpContext) {
    const date  = request.input('date')
    const start = request.input('start')
    const end   = request.input('end')

    if (!date || !start || !end) {
      return response.badRequest({ message: 'date, start, end are required' })
    }

    const expiryTime = DateTime.now().minus({ minutes: 30 }).toSQL()!

    const bookings = await Booking.query()
      .whereNotNull('schedule_id')
      .whereRaw('DATE(booking_date) = ?', [date])
      .where((q) => {
        q.where('booking_status', 'confirmed')
          .orWhere((inner) => {
            inner.where('booking_status', 'pending').andWhere('created_at', '>', expiryTime)
          })
      })
      .where('booking_start', '<', end)
      .where('booking_end', '>', start)
      .preload('coachSchedule')

    const busyCoachIds = [...new Set(
      bookings
        .filter((b) => b.coachSchedule)
        .map((b) => b.coachSchedule.coachId)
    )]

    return response.ok({ busyCoachIds })
  }
}
