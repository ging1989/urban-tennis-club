import User from '#models/user'
import Customer from '#models/customer'
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
    })

    await Customer.create({
      customerName: payload.fullName ?? payload.username,
      customerEmail: payload.email,
      customerPhone: '',
      customerType: 'member',
      userId: user.id,
    })

    await auth.use('web').login(user)
    return response.redirect().toRoute('home')
  }
}