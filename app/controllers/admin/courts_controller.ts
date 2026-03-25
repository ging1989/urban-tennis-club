import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import db from '@adonisjs/lucid/services/db'

export default class AdminCourtsController {

  async index({ view }: HttpContext) {
    const courts = await Court.all()

    const bookingCounts = await db
      .from('bookings')
      .select('court_id')
      .count('* as total')
      .groupBy('court_id')

    const countMap: Record<number, number> = {}
    for (const row of bookingCounts) {
      countMap[row.court_id] = Number(row.total)
    }

    const courtsWithCount = courts.map((c) => ({
      ...c.toJSON(),
      bookingCount: countMap[c.courtId] || 0,
    }))

    return view.render('pages/admin/courts/index', {
      courts: courtsWithCount,
      currentPage: 'courts',
      breadcrumb: 'Courts',
      pendingCount: 0,
    })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/admin/courts/form', {
      court: null,
      currentPage: 'courts',
      breadcrumb: 'Add Court',
      pendingCount: 0,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const { courtName, courtStatus, courtPricePerHr } = request.only([
      'courtName', 'courtStatus', 'courtPricePerHr',
    ])

    if (!courtName || !courtStatus || !courtPricePerHr) {
      session.flash('error', 'All fields are required.')
      session.flashAll()
      return response.redirect().back()
    }

    await Court.create({
      courtName,
      courtStatus,
      courtPricePerHr: parseFloat(courtPricePerHr),
    })

    session.flash('success', `Court "${courtName}" created successfully.`)
    return response.redirect().toRoute('admin.courts')
  }

  async edit({ params, view }: HttpContext) {
    const court = await Court.findOrFail(params.id)
    return view.render('pages/admin/courts/form', {
      court,
      currentPage: 'courts',
      breadcrumb: 'Edit Court',
      pendingCount: 0,
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const court = await Court.findOrFail(params.id)
    const { courtName, courtStatus, courtPricePerHr } = request.only([
      'courtName', 'courtStatus', 'courtPricePerHr',
    ])

    if (courtName)       court.courtName       = courtName
    if (courtStatus)     court.courtStatus     = courtStatus
    if (courtPricePerHr) court.courtPricePerHr = parseFloat(courtPricePerHr)

    await court.save()
    session.flash('success', `Court "${court.courtName}" updated.`)
    return response.redirect().toRoute('admin.courts')
  }

  async destroy({ params, response, session }: HttpContext) {
    const court = await Court.findOrFail(params.id)
    const name = court.courtName
    await court.delete()
    session.flash('success', `Court "${name}" deleted.`)
    return response.redirect().toRoute('admin.courts')
  }
}
