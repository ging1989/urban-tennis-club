import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Booking from '#models/booking'
import Customer from '#models/customer'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // ล้างข้อมูลเก่าก่อน (ถ้าต้องการ)
    // await Booking.query().delete()

    // หา customer ของ user01 จาก email
    const user01 = await User.findBy('email', 'user@test.com')
    let user01CustomerId: number | null = null
    if (user01) {
      let customer = await Customer.findBy('user_id', user01.id)
      if (!customer) {
        customer = await Customer.create({
          customerName: user01.fullName ?? 'User 01',
          customerPhone: '0800000001',
          customerType: 'member',
          userId: user01.id,
        })
      }
      user01CustomerId = customer.customerId
    }

    await Booking.createMany([
      {
        customerId: 1,
        courtId: 1,
        bookingDate: DateTime.now(),
        bookingStart: '21:00:00',
        bookingEnd: '23:00:00',
        bookingCourtPrice: 500,
        totalPrice: 500,
        bookingStatus: 'confirmed',
      },
      {
        customerId: 2,
        courtId: 2,
        bookingDate: DateTime.fromISO('2026-05-30'),
        bookingStart: '14:00:00',
        bookingEnd: '15:00:00',
        bookingCourtPrice: 250,
        totalPrice: 250,
        bookingStatus: 'pending',
      },
      ...(user01CustomerId
        ? [
            {
              customerId: user01CustomerId,
              courtId: 1,
              bookingDate: DateTime.fromISO('2026-05-30'),
              bookingStart: '10:00:00',
              bookingEnd: '12:00:00',
              bookingCourtPrice: 500,
              totalPrice: 500,
              bookingStatus: 'confirmed' as const,
            },
          ]
        : []),
    ])
  }
}