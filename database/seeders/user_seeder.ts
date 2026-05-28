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
        password: 'Admin1234',
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

    console.log('Admin user created: admin01@urbantennis.com / Admin1234')
  }
}
