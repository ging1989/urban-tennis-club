import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('booking_id')
      table.integer('customer_id').unsigned().references('customer_id').inTable('customers')
      table.integer('court_id').unsigned().references('court_id').inTable('courts')
      table.integer('schedule_id').unsigned().nullable().references('schedule_id').inTable('coach_schedules')
      table.date('booking_date')
      table.time('booking_start')
      table.time('booking_end')
      table.decimal('booking_court_price', 8, 2)
      table.decimal('booking_coach_price', 8, 2).nullable()
      table.decimal('total_price', 8, 2)
      table.string('booking_status')
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}