import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coach_schedules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('schedule_id')
      table.integer('coach_id').unsigned().references('coach_id').inTable('coaches')
      table.date('avail_date')
      table.time('start_time')
      table.time('end_time')
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}