// app/controllers/home_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Coach from '#models/coach'

export default class HomeController {
  async index({ view }: HttpContext) {
    const courts = await Court.query()
      .where('court_status', 'available')
      .orderBy('court_id', 'asc')

    const coaches = await Coach.query()
      .preload('coachPricing')
      .orderBy('coach_id', 'asc')

    return view.render('pages/home', { courts, coaches })
  }
}