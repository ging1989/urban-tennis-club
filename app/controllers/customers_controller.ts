import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import Tier from '#models/tier'

export default class CustomersController {
  /**
   * POST /customers/register
   * สมัครสมาชิกใหม่
   */
  async register({ request, response }: HttpContext) {
    const { customerName, customerPhone, customerEmail } = request.only([
      'customerName',
      'customerPhone',
      'customerEmail',
    ])

    // เช็ค email ซ้ำ
    const existing = await Customer.findBy('customer_email', customerEmail)
    if (existing) {
      return response.conflict({ message: 'Email already in use' })
    }

    // ดึง tier เริ่มต้น (min_hours = 0)
    const defaultTier = await Tier.query().where('min_hours', 0).first()

    const customer = await Customer.create({
      customerName,
      customerPhone,
      customerEmail,
      customerType: 'member',
      tierId: defaultTier?.tierId ?? null,
    })

    return response.created({
      message: 'Customer registered successfully',
      customer,
    })
  }

  /**
   * GET /customers/:id
   * ดูข้อมูล customer
   */
  async show({ params, response }: HttpContext) {
    const customer = await Customer.query()
      .where('customer_id', params.id)
      .preload('tier')
      .firstOrFail()

    return response.ok(customer)
  }

  /**
   * PATCH /customers/:id/tier
   * อัปเดต tier ตาม totalPlayHours อัตโนมัติ
   */
  async updateTier({ params, response }: HttpContext) {
    const customer = await Customer.query()
      .where('customer_id', params.id)
      .preload('tier')
      .firstOrFail()

    // หา tier ที่เหมาะสมจาก totalPlayHours
    const tiers = await Tier.query().orderBy('min_hours', 'desc')
    const newTier = tiers.find((t) => customer.totalPlayHours >= t.minHours)

    if (newTier && newTier.tierId !== customer.tierId) {
      customer.tierId = newTier.tierId
      await customer.save()
    }

    await customer.load('tier')

    return response.ok({
      message: 'Tier updated',
      customer,
    })
  }
}