import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const rows = await this.db
      .from('bookings')
      .orderBy('booking_date', 'asc')
      .orderBy('booking_id', 'asc')
      .select('booking_id', 'booking_date')

    const used = new Set<string>()

    for (const row of rows) {
      const d = new Date(row.booking_date)
      const yy = String(d.getFullYear()).slice(2)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const prefix = yy + mm + dd

      let num: string
      do {
        num = prefix + String(Math.floor(Math.random() * 9000) + 1000)
      } while (used.has(num))
      used.add(num)

      await this.db.from('bookings').where('booking_id', row.booking_id).update({ booking_number: num })
    }
  }

  async down() {}
}
