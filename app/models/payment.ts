import { column, BaseModel, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Booking from './booking.js'

export default class Payment extends BaseModel {
    static table = 'payments'
    static primaryKey = 'payment_id'

    @column({ isPrimary: true})
    declare paymentId: number

    @column()
    declare bookingId: number

    @column()
    declare paymentType: string

    @column()
    declare amount: number

    @column()
    declare paymentMethod: string

    @column()
    declare paymentStatus: string

    @column()
    declare slipUrl: string | null

    @column.dateTime()
    declare paymentTime: DateTime

    @column.dateTime({ autoCreate:true })
    declare createdAt: DateTime

    @belongsTo(() => Booking, { foreignKey: 'bookingId' })
    declare booking: BelongsTo<typeof Booking>
}