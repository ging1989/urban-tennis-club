import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coach_schedules'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('day_of_week', 'avail_date')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('avail_date', 'day_of_week')
    })
  }
}
