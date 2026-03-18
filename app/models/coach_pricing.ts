import { column, BaseModel, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Coach from './coach.js'

export default class CoachPricing extends BaseModel {
    static table = 'coach_pricings'
    static primaryKey = 'coach_level_id'

    @column({ isPrimary: true})
    declare coachLevelId: number

    @column()
    declare coachLevelDesc: string

    @column()
    declare coachPrice: number

    @column.dateTime({ autoCreate:true })
    declare createdAt: DateTime

    @hasMany(() => Coach, { foreignKey: 'coachLevelId' })
    declare coaches: HasMany<typeof Coach>
}