import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Customer from '#models/customer'

export default class AdminUsersController {

  async index({ view, auth }: HttpContext) {
    const users = await User.all()
    const customers = await Customer.query().preload('tier')

    return view.render('pages/admin/users/index', {
      users,
      customers,
      currentPage: 'users',
      breadcrumb: 'Users',
      pendingCount: 0,
      currentUserId: auth.user!.id,
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const { fullName, role } = request.only(['fullName', 'role'])

    if (fullName !== undefined) user.fullName = fullName
    if (role && ['admin', 'member'].includes(role)) user.role = role

    await user.save()
    session.flash('success', 'User updated successfully.')
    return response.redirect().toRoute('admin.users')
  }

  async destroy({ params, response, session, auth }: HttpContext) {
    if (Number(params.id) === auth.user!.id) {
      session.flash('error', 'You cannot delete your own account.')
      return response.redirect().toRoute('admin.users')
    }

    const user = await User.findOrFail(params.id)
    await user.delete()
    session.flash('success', 'User deleted.')
    return response.redirect().toRoute('admin.users')
  }
}
