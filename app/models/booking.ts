import { column, BaseModel, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Customer from './customer.js'
import Court from './court.js'
import CoachSchedule from './coach_schedule.js'
import Payment from './payment.js'


export default class Booking extends BaseModel {
    static table = 'bookings'
    static primaryKey = 'booking_id'

    @column({ isPrimary: true})
    declare bookingId: number

    @column()
    declare bookingRef: string | null

    @column()
    declare customerId: number

    @column()
    declare courtId: number

    @column()
    declare scheduleId: number | null

    @column.date()
    declare bookingDate: DateTime

    @column()
    declare bookingStart: string

    @column()
    declare bookingEnd: string

    @column()
    declare bookingCourtPrice: number

    @column()
    declare bookingCoachPrice: number | null

    @column()
    declare totalPrice: number

    @column()
    declare bookingStatus: 'pending' | 'confirmed' | 'cancelled'
    
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Customer, { foreignKey: 'customerId'})
    declare customer: BelongsTo<typeof Customer>

    @belongsTo(() => Court, { foreignKey: 'courtId' })
    declare court: BelongsTo<typeof Court>

    @belongsTo(() => CoachSchedule, { foreignKey: 'scheduleId' })
    declare coachSchedule: BelongsTo<typeof CoachSchedule>

    @hasOne(() => Payment, { foreignKey: 'bookingId' })
    declare payment: HasOne<typeof Payment>
}