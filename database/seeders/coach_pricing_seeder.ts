import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CoachPricing from '#models/coach_pricing'

export default class extends BaseSeeder {
  async run() {
    await CoachPricing.updateOrCreate({ coachLevelDesc: 'Coach'    }, { coachLevelDesc: 'Coach',    coachPrice: 500 })
    await CoachPricing.updateOrCreate({ coachLevelDesc: 'Master' }, { coachLevelDesc: 'Master', coachPrice: 800 })
    await CoachPricing.updateOrCreate({ coachLevelDesc: 'Elite'      }, { coachLevelDesc: 'Elite',       coachPrice: 1000 })

    console.log('Coach pricings seeded')
  }
}
