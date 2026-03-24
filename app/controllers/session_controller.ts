import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { identifier, password } = request.all()

    try {
      const user = await User.verifyCredentials(identifier, password)
      await auth.use('web').login(user)
      return user.role === 'admin'
        ? response.redirect().toRoute('admin')
        : response.redirect().toRoute('home')
    } catch {
      session.flash('error', 'Invalid username, email, or password.')
      session.flashExcept(['password'])
      return response.redirect().back()
    }
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}