import type { ApplicationService } from '@adonisjs/core/types'
import cron from 'node-cron'
import { cancelExpiredBookings } from '#services/booking_expiry_service'

export default class SchedulerProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    if (!this.app.inProduction && !this.app.inDev) return

    cron.schedule('*/5 * * * *', async () => {
      try {
        await cancelExpiredBookings()
      } catch (err) {
        console.error('[BookingExpiry] Skipped:', err.message)
      }
    })
  }
}