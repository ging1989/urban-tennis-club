import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coaches'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('coach_id')
      table.string('coach_name')
      table.integer('coach_level_id').unsigned().references('coach_level_id').inTable('coach_pricings')
      table.string('coach_status')
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}