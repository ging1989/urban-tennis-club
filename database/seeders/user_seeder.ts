import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { username: 'admin' },
      {
        fullName: 'Admin',
        username: 'admin',
        email: 'admin01@urbantennis.com',
        password: 'Admin@1234',
        role: 'admin',
      }
    )

    await User.updateOrCreate(
      { username: 'member01' },
      {
        fullName: 'Member 01',
        username: 'member01',
        email: 'member01@test.com',
        password: 'Member1234',
        role: 'member',
      }
    )

    await User.updateOrCreate(
      { username: 'member02' },
      {
        fullName: 'Member 02',
        username: 'member02',
        email: 'member02@test.com',
        password: 'Member1234',
        role: 'member',
      }
    )

    console.log('Seeded users:')
    console.log('  admin    → admin01@urbantennis.com')
    console.log('  member01 → member01@test.com')
    console.log('  member02 → member02@test.com')
  }
}
