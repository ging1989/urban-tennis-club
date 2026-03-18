import { column, BaseModel, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Booking from './booking.js'

export default class Court extends BaseModel {
    static table = 'courts'
    static primaryKey = 'court_id'

    @column({ isPrimary: true})
    declare courtId: number

    @column()
    declare courtName: string

    @column()
    declare courtStatus: string

    @column()
    declare courtPricePerHr: number

    @column.dateTime({ autoCreate: true})
    declare createdAt: DateTime

    @hasMany(() => Booking, { foreignKey: 'courtId' })
    declare bookings: HasMany<typeof Booking>
}