import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  redirectTo = '/admin/login'

  async handle(ctx: HttpContext, next: NextFn) {
    const user = await ctx.auth.use('web').check()
      ? ctx.auth.use('web').user
      : null

    if (!user) {
      return ctx.response.redirect(this.redirectTo)
    }

    if (user.role !== 'admin') {
      return ctx.response.redirect('/')
    }

    return next()
  }
}
