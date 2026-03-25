import type { HttpContext } from '@adonisjs/core/http'

export default class AdminSettingsController {

  async index({ view }: HttpContext) {
    return view.render('pages/admin/settings/index', {
      currentPage: 'settings',
      breadcrumb: 'Settings',
      pendingCount: 0,
    })
  }

  async update({ session, response }: HttpContext) {
    session.flash('success', 'Settings saved successfully.')
    return response.redirect().back()
  }
}
