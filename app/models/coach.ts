import { column, BaseModel, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import CoachPricing from './coach_pricing.js'
import CoachSchedule from './coach_schedule.js'

export default class Coach extends BaseModel {
    static table = 'coaches'
    static primaryKey = 'coach_id'

    @column({ isPrimary: true})
    declare coachId: number

    @column()
    declare coachName: string

    @column()
    declare coachLevelId: number

    @column()
    declare coachStatus: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => CoachPricing, { foreignKey: 'coachLevelId' })
    declare coachPricing: BelongsTo<typeof CoachPricing>

    @hasMany(() => CoachSchedule, { foreignKey: 'coachId' })
    declare coachSchedules: HasMany<typeof CoachSchedule>
}