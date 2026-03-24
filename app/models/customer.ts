import { column, BaseModel, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Tier from './tier.js'
import Booking from './booking.js'
import User from './user.js'

export default class Customer extends BaseModel {
    static table = 'customers'
    static primaryKey = 'customer_id'

    @column({ isPrimary: true})
    declare customerId: number

    @column()
    declare customerName: string

    @column()
    declare customerPhone: string

    @column()
    declare customerEmail: string

    @column()
    declare userId: number | null

    @column()
    declare customerType: string

    @column()
    declare tierId: number | null

    @column.dateTime({ autoCreate:true })
    declare createdAt: DateTime

    @belongsTo(() => Tier, { foreignKey: 'tierId' })
    declare tier: BelongsTo<typeof Tier>

    @belongsTo(() => User, { foreignKey: 'userId' })
    declare user: BelongsTo<typeof User>

    @hasMany(() => Booking, { foreignKey: 'customerId'})
    declare booking: HasMany<typeof Booking>
}