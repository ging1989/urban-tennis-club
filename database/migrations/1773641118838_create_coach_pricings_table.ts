import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coach_pricings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('coach_level_id')
      table.string('coach_level_desc')
      table.decimal('coach_price', 8, 2)
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}