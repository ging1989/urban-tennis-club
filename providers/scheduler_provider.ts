import type { ApplicationService } from '@adonisjs/core/types'
import cron from 'node-cron'
import { cancelExpiredBookings } from '#services/booking_expiry_service'

export default class SchedulerProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    cron.schedule('*/5 * * * *', async () => {
      await cancelExpiredBookings()
    })
  }
}