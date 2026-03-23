import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Booking from '#models/booking'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // ล้างข้อมูลเก่าก่อน (ถ้าต้องการ)
    // await Booking.query().delete()

    await Booking.createMany([
      {
        customerId: 1, // สมมติว่ามีลูกค้า id 1 อยู่แล้ว
        courtId: 1,
        bookingDate: DateTime.now().toISODate(), // วันนี้
        bookingStart: '09:00:00',
        bookingEnd: '11:00:00',
        bookingCourtPrice: 500,
        totalPrice: 500,
        bookingStatus: 'confirmed',
      },
      {
        customerId: 2,
        courtId: 1,
        bookingDate: DateTime.fromISO('2026-04-04')
        bookingStart: '14:00:00',
        bookingEnd: '15:00:00',
        bookingCourtPrice: 250,
        totalPrice: 250,
        bookingStatus: 'pending',
      }
    ])
  }
}