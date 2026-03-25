import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AdminSessionController {
  async create({ view, auth, response }: HttpContext) {
    if (await auth.use('web').check()) {
      const user = auth.use('web').user!
      if (user.role === 'admin') return response.redirect().toRoute('admin')
    }
    return view.render('pages/auth/admin_login')
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { identifier, password } = request.all()

    try {
      const user = await User.verifyCredentials(identifier, password)

      if (user.role !== 'admin') {
        session.flash('error', 'You do not have admin access.')
        session.flashExcept(['password'])
        return response.redirect().back()
      }

      await auth.use('web').login(user)
      return response.redirect().toRoute('admin')
    } catch {
      session.flash('error', 'Invalid username, email, or password.')
      session.flashExcept(['password'])
      return response.redirect().back()
    }
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('admin.login')
  }
}
