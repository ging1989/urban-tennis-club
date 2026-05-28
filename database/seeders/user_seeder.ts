import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin01@urbantennis.com' },
      {
        fullName: 'Admin',
        username: 'admin',
        email: 'admin01@urbantennis.com',
        password: 'Admin1234',
        role: 'admin',
      }
    )

    await User.updateOrCreate(
      { email: 'user@test.com' },
      {
        fullName: 'User_01',
        username: 'user01',
        email: 'user@test.com',
        password: 'User1234',
        role: 'member',
      }
    )

    console.log('Admin user created: admin01@urbantennis.com / Admin1234')
  }
}
