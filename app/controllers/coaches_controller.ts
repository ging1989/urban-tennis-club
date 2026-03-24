import type { HttpContext } from '@adonisjs/core/http'
import Coach from '#models/coach'
import CoachSchedule from '#models/coach_schedule'

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
}
