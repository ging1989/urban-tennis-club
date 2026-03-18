import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tiers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('tier_id')
      table.string('tier_desc')
      table.integer('min_hours')
      table.integer('tier_discount')
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}