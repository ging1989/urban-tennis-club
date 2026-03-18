import { column, BaseModel, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Coach from './coach.js'
import Booking from './booking.js'

export default class CoachSchedule extends BaseModel {
    static table = 'coach_schedules'
    static primaryKey = 'schedule_id'

    @column({ isPrimary: true})
    declare scheduleId: number

    @column()
    declare coachId: number

    @column.date()
    declare availDate: DateTime

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