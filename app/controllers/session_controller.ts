import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ view, request }: HttpContext) {
    const redirect = request.input('redirect', '')
    return view.render('pages/auth/login', { redirect })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { identifier, password, redirect } = request.all()

    try {
      const user = await User.verifyCredentials(identifier, password)
      await auth.use('web').login(user)
      if (user.role === 'admin') return response.redirect().toRoute('admin')
      if (redirect && redirect.startsWith('/')) return response.redirect().toPath(redirect)
      return response.redirect().toRoute('home')
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