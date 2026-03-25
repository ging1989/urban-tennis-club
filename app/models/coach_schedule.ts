import { column, BaseModel, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Coach from './coach.js'
import Booking from './booking.js'

export default class CoachSchedule extends BaseModel {
    static table = 'coach_schedules'
    static primaryKey = 'schedule_id'

    @column({ isPrimary: true})
    declare scheduleId: number

    @column()
    declare coachId: number

    @column({ columnName: 'avail_date' })
    declare dayOfWeek: number  // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

    @column()
    declare startTime: string

    @column()
    declare endTime: string

    @column.dateTime({ autoCreate: true})
    declare createdAt: DateTime

    @belongsTo(() => Coach, { foreignKey: 'coachId' })
    declare coach: BelongsTo<typeof Coach>

    @hasMany(() => Booking, { foreignKey: 'scheduleId' })
    declare bookings: HasMany<typeof Booking>
}