import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('payment_id')
      table.integer('booking_id').unsigned().references('booking_id').inTable('bookings')
      table.string('payment_type')
      table.decimal('amount', 8, 2)
      table.string('payment_method')
      table.string('payment_status')
      table.timestamp('payment_time')
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}