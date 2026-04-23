import User from '#models/user'
import Customer from '#models/customer'
import Tier from '#models/tier'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)

    const user = await User.create({
      fullName: payload.fullName,
      username: payload.username,
      email: payload.email,
      password: payload.password,
      role: 'member',
    })

    const defaultTier = await Tier.query().where('min_hours', 0).first()

    // หา guest customer ที่ email ตรงกัน และยังไม่ผูก user
    const existing = await Customer.query()
      .where('customer_email', payload.email)
      .whereNull('user_id')
      .where('customer_type', 'guest')
      .first()

    if (existing) {
      // ผูก customer เดิม — ไม่คำนวณ tier ย้อนหลัง เริ่มที่ default tier
      existing.userId = user.id
      existing.customerType = 'member'
      existing.tierId = defaultTier?.tierId ?? null
      if (!existing.customerName && (payload.fullName ?? payload.username)) {
        existing.customerName = payload.fullName ?? payload.username ?? existing.customerName
      }
      await existing.save()
    } else {
      await Customer.create({
        customerName: payload.fullName ?? payload.username ?? '',
        customerEmail: payload.email,
        customerPhone: '',
        customerType: 'member',
        userId: user.id,
        tierId: defaultTier?.tierId ?? null,
      })
    }

    await auth.use('web').login(user)
    return response.redirect().toRoute('home')
  }
}