import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Tier from '#models/tier'

export default class extends BaseSeeder {
  async run() {
    await Tier.updateOrCreate({ tierDesc: 'Bronze' }, { tierDesc: 'Bronze', minHours: 0,  tierDiscount: 0  })
    await Tier.updateOrCreate({ tierDesc: 'Silver' }, { tierDesc: 'Silver', minHours: 10, tierDiscount: 5  })
    await Tier.updateOrCreate({ tierDesc: 'Gold'   }, { tierDesc: 'Gold',   minHours: 20, tierDiscount: 10 })

    console.log('Tiers seeded')
  }
}
