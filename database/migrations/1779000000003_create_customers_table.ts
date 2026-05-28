import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('customer_id')
      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('customer_email').nullable()
      table.date('birth_date').nullable()
      table.string('customer_type')
      table.integer('tier_id').unsigned().nullable().references('tier_id').inTable('tiers').onDelete('SET NULL')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: false })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
