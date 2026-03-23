import Booking from '#models/booking'
import { DateTime } from 'luxon'

export async function cancelExpiredBookings() {
  const expiry = DateTime.now().minus({ minutes: 30 }).toSQL()

  const expired = await Booking.query()
    .where('booking_status', 'pending')
    .where('created_at', '<', expiry)

  for (const booking of expired) {
    booking.bookingStatus = 'cancelled'
    await booking.save()
  }

  if (expired.length > 0) {
    console.log(`[BookingExpiry] Cancelled ${expired.length} expired bookings`)
  }
}