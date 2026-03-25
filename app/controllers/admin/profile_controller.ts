import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

export default class AdminProfileController {

  async index({ view }: HttpContext) {
    return view.render('pages/admin/profile/index', {
      currentPage: 'profile',
      breadcrumb: 'My Profile',
      pendingCount: 0,
    })
  }

  async update({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { fullName, username, email } = request.only(['fullName', 'username', 'email'])

    if (fullName !== undefined) user.fullName = fullName
    if (username !== undefined) user.username = username
    if (email && email !== user.email) {
      const existing = await User.findBy('email', email)
      if (existing && existing.id !== user.id) {
        session.flash('error', 'Email is already in use by another account.')
        return response.redirect().back()
      }
      user.email = email
    }

    await user.save()
    session.flash('success', 'Profile updated successfully.')
    return response.redirect().back()
  }

  async password({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { currentPassword, newPassword, confirmPassword } = request.only([
      'currentPassword',
      'newPassword',
      'confirmPassword',
    ])

    if (!currentPassword || !newPassword || !confirmPassword) {
      session.flash('error', 'All password fields are required.')
      return response.redirect().back()
    }

    if (newPassword !== confirmPassword) {
      session.flash('error', 'New passwords do not match.')
      return response.redirect().back()
    }

    if (newPassword.length < 8) {
      session.flash('error', 'Password must be at least 8 characters.')
      return response.redirect().back()
    }

    const valid = await hash.verify(user.password, currentPassword)
    if (!valid) {
      session.flash('error', 'Current password is incorrect.')
      return response.redirect().back()
    }

    user.password = await hash.make(newPassword)
    await user.save()

    session.flash('success', 'Password changed successfully.')
    return response.redirect().back()
  }
}
