import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'courts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('court_id')
      table.string('court_name')
      table.string('court_status')
      table.decimal('court_price_per_hr', 8, 2)
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}