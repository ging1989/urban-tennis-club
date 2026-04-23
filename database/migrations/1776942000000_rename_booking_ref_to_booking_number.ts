import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('booking_ref', 'booking_number')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('booking_number', 'booking_ref')
    })
  }
}
