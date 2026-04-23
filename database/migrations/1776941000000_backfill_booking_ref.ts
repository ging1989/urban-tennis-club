import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ดึง bookings ที่ยังไม่มี booking_ref เรียงตาม date + booking_id
    const rows = await this.db
      .from('bookings')
      .whereNull('booking_ref')
      .orderBy('booking_date', 'asc')
      .orderBy('booking_id', 'asc')
      .select('booking_id', 'booking_date')

    // จัดกลุ่มตาม date แล้ว assign seq
    const countPerDate: Record<string, number> = {}
    for (const row of rows) {
      const d = new Date(row.booking_date)
      const yy = String(d.getFullYear()).slice(2)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateKey = yy + mm + dd

      countPerDate[dateKey] = (countPerDate[dateKey] ?? 0) + 1
      const ref = dateKey + String(countPerDate[dateKey]).padStart(3, '0')

      await this.db
        .from('bookings')
        .where('booking_id', row.booking_id)
        .update({ booking_ref: ref })
    }
  }

  async down() {
    await this.db.from('bookings').update({ booking_ref: null })
  }
}
