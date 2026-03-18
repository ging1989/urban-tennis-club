import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('customer_id')
      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('customer_email').unique()
      table.string('customer_type')
      table.integer('tier_id').unsigned().nullable().references('tier_id').inTable('tiers').onDelete('SET NULL')
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}