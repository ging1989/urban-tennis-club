import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Court from '#models/court'

export default class extends BaseSeeder {
  async run() {
    await Court.updateOrCreate({ courtName: 'Court 1' }, { courtName: 'Court 1', courtStatus: 'available', courtPricePerHr: 300 })
    await Court.updateOrCreate({ courtName: 'Court 2' }, { courtName: 'Court 2', courtStatus: 'available', courtPricePerHr: 300 })
    await Court.updateOrCreate({ courtName: 'Court 3' }, { courtName: 'Court 3', courtStatus: 'available', courtPricePerHr: 300 })
    await Court.updateOrCreate({ courtName: 'Court 4' }, { courtName: 'Court 4', courtStatus: 'available', courtPricePerHr: 300 })

    console.log('Courts seeded')
  }
}
