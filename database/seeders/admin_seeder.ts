import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@urbantennis.com' },
      {
        fullName: 'Admin',
        username: 'admin',
        email: 'admin@urbantennis.com',
        password: 'Admin1234',
        role: 'admin',
      }
    )

    console.log('Admin user created: admin@urbantennis.com / Admin1234')
  }
}
