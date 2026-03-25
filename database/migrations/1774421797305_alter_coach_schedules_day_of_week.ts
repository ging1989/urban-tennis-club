import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coach_schedules'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avail_date')
      table.tinyint('day_of_week').unsigned().comment('0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat').after('coach_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('day_of_week')
      table.date('avail_date').after('coach_id')
    })
  }
}
