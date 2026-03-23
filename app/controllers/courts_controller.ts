import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Coach from '#models/coach'
//import { raw } from 'mysql2'

export default class CourtsController {

  async index({ view, request }: HttpContext) {
    const rawDate      = request.input('date')
    const date = !rawDate || rawDate === 'undefined' ? null : rawDate
    const startTime = request.input('startTime')
    const duration  = request.input('duration')
    const courtId   = request.input('courtId')

    let query = Court.query()
      .where('court_status', 'available')
      .orderBy('court_id', 'asc')

    if (courtId) {
      query = query.where('court_id', courtId)
    }

    if (date && startTime && duration) {
      const normalised = startTime.replace('.', ':')  // แก้ 08.00 → 08:00
      const [h, m]     = normalised.split(':').map(Number)
      const endHour    = h + parseInt(duration)
      const start      = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
      const endTime    = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`

      query = query.whereDoesntHave('bookings', (b) => {
        b.where('booking_date', date)
        .where((q) => {
          q.whereBetween('booking_start', [start, endTime])
            .orWhereBetween('booking_end',  [start, endTime])
            .orWhere((q2) => {
              q2.where('booking_start', '<=', start)
                .where('booking_end',   '>=', endTime)
            })
        })
      })
  }

  const courts = await query

  return view.render('pages/courts', {
    courts,
    filters: { date, startTime, duration, courtId }
  })
}

  async show({ params, view }: HttpContext) {
    const court = await Court.findOrFail(params.id)
    return view.render('pages/court_detail', { court })
  }

  async availability({ params, request, response }: HttpContext) {
    const date = request.input('date')
    if (!date) {
      return response.badRequest({ message: 'date is required' })
    }
    const court = await Court.findOrFail(params.id)
    return response.ok({ court, date })
  }

  async booking({ view, request, response, session }: HttpContext) {
  const courtId = request.input('courtId')

  if (!courtId) {
    session.flash('error', 'Please select a court')
    return response.redirect().back()
  }

  const courts = await Court.query()
    .where('court_status', 'available')
    .orderBy('court_id', 'asc')

  const coaches = await Coach.query()
    .preload('coachPricing')
    .orderBy('coach_id', 'asc')

  return view.render('pages/booking', { 
    courts, 
    coaches, 
    selectedCourtId: parseInt(courtId) 
  })
}

}