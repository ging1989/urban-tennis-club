import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import Tier from '#models/tier'
import Booking from '#models/booking'

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
   * GET /member/profile
   * หน้าโปรไฟล์สมาชิก
   */
  async profile({ auth, view, response }: HttpContext) {
    const user = auth.user!
    const customer = await Customer.query()
      .where('user_id', user.id)
      .preload('tier')
      .first()

    if (!customer) {
      return user.role === 'admin'
        ? response.redirect().toRoute('admin')
        : response.redirect().toPath('/')
    }

    const bookings = await Booking.query()
      .where('customer_id', customer.customerId)
      .preload('court')
      .preload('payment')
      .orderBy('booking_date', 'desc')
      .limit(10)

    return view.render('pages/member/profile', { user, customer, bookings })
  }

  /**
   * PATCH /customers/:id/tier
   * อัปเดต tier ตาม totalPlayHours อัตโนมัติ
   */
  async updateTier({ params, response }: HttpContext) {
    const customer = await Customer.query()
      .where('customer_id', params.id)
      .preload('tier')
      .preload('booking')
      .firstOrFail()

    const totalHours = customer.booking
      .filter((b) => b.bookingStatus === 'confirmed')
      .reduce((sum, b) => {
        const [sh] = b.bookingStart.split(':').map(Number)
        const [eh] = b.bookingEnd.split(':').map(Number)
        return sum + (eh - sh)
      }, 0)

    const tiers = await Tier.query().orderBy('min_hours', 'desc')
    const newTier = tiers.find((t) => totalHours >= t.minHours)

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