import { column, BaseModel, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Customer from './customer.js'
import { DateTime } from 'luxon'

export default class Tier extends BaseModel {
    static table = 'tiers'
    static primaryKey = 'tier_id'

    @column({ isPrimary: true})
    declare tierId: number

    @column()
    declare tierDesc: string

    @column()
    declare minHours: number

    @column()
    declare tierDiscount: number

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @hasMany(() => Customer , { foreignKey: 'tierId' })
    declare members: HasMany<typeof Customer>
}