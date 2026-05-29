import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Coach from '#models/coach'
import CoachPricing from '#models/coach_pricing'
import CoachSchedule from '#models/coach_schedule'

export default class extends BaseSeeder {
  async run() {
    const coach    = await CoachPricing.findByOrFail('coach_level_desc', 'Coach')
    const master = await CoachPricing.findByOrFail('coach_level_desc', 'Master')
    const elite      = await CoachPricing.findByOrFail('coach_level_desc', 'Elite')

    const coach1 = await Coach.updateOrCreate(
      { coachName: 'Anan' },
      { coachName: 'Anan', coachLevelId: coach.coachLevelId, coachStatus: 'available' }
    )
    const coach2 = await Coach.updateOrCreate(
      { coachName: 'Ben' },
      { coachName: 'Ben', coachLevelId: master.coachLevelId, coachStatus: 'available' }
    )
    const coach3 = await Coach.updateOrCreate(
      { coachName: 'Chris' },
    { coachName: 'Chris', coachLevelId: elite.coachLevelId, coachStatus: 'available' }
    )

    // Coach 1: Mon–Fri 09:00–17:00
    for (const day of [1, 2, 3, 4, 5]) {
      await CoachSchedule.updateOrCreate(
        { coachId: coach1.coachId, dayOfWeek: day },
        { coachId: coach1.coachId, dayOfWeek: day, startTime: '09:00:00', endTime: '17:00:00' }
      )
    }
    // Coach 2: Mon/Wed/Fri 10:00–18:00
    for (const day of [1, 3, 5]) {
      await CoachSchedule.updateOrCreate(
        { coachId: coach2.coachId, dayOfWeek: day },
        { coachId: coach2.coachId, dayOfWeek: day, startTime: '10:00:00', endTime: '18:00:00' }
      )
    }
    // Coach 3: Sat–Sun 08:00–16:00
    for (const day of [6, 0]) {
      await CoachSchedule.updateOrCreate(
        { coachId: coach3.coachId, dayOfWeek: day },
        { coachId: coach3.coachId, dayOfWeek: day, startTime: '08:00:00', endTime: '16:00:00' }
      )
    }

    console.log('Coaches and schedules seeded')
  }
}
