/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

import AdminController        from '#controllers/admin_controller'
import AdminSessionController from '#controllers/admin_session_controller'
import AdminProfileController from '#controllers/admin/profile_controller'
import AdminReportsController from '#controllers/admin/reports_controller'
import HomeController      from '#controllers/home_controller'
import CourtsController    from '#controllers/courts_controller'
import BookingsController  from '#controllers/bookings_controller'
import CoachesController   from '#controllers/coaches_controller'
import CustomersController from '#controllers/customers_controller'
import PaymentsController  from '#controllers/payments_controller'

// ── Auth ──────────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])
    router.get('login',  [controllers.Session,    'create']).as('session.create')
    router.post('login', [controllers.Session,    'store']).as('session.store')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())

// ── Home ──────────────────────────────────────────────────────────────────
router.get('/', [HomeController, 'index']).as('home')

// ── Courts ────────────────────────────────────────────────────────────────
router.get('/courts',                    [CourtsController, 'index'])
router.get('/courts/:id',               [CourtsController, 'show'])
router.get('/courts/:id/availability',  [CourtsController, 'availability'])

// ── Bookings ──────────────────────────────────────────────────────────────
// NOTE: /bookings/new ต้องอยู่ก่อน /bookings/:id เพราะ AdonisJS match top-down
// ถ้า :id อยู่ก่อน จะดัก "new" เป็น id แทน
router.get('/bookings/new',                  [BookingsController, 'new'])
router.get('/bookings/:id/confirmation',     [BookingsController, 'confirmation'])
router.post('/bookings',                     [BookingsController, 'store'])

router.patch('/bookings/:id/status',         [BookingsController, 'updateStatus'])

router
  .group(() => {
    router.get('/bookings/:id',                  [BookingsController, 'show'])
    router.get('/bookings/customer/:customerId', [BookingsController, 'byCustomer'])
    router.get('/member/profile',                [CustomersController, 'profile']).as('member.profile')
    router.post('/member/profile',               [CustomersController, 'updateProfile']).as('member.profile.update')
  })
  .use(middleware.auth())

// ── Coaches ───────────────────────────────────────────────────────────────
router.get('/coaches',               [CoachesController, 'index'])
router.get('/coaches/busy',          [CoachesController, 'busy'])
router.get('/coaches/:id',           [CoachesController, 'show'])
router.get('/coaches/:id/schedules', [CoachesController, 'schedules'])

// ── Customers ─────────────────────────────────────────────────────────────
router.post('/customers/register',  [CustomersController, 'register'])
router.get('/customers/:id',        [CustomersController, 'show'])
router.patch('/customers/:id/tier', [CustomersController, 'updateTier'])

// ── Booking Status (Guest) ────────────────────────────────────────────────
router.get('/booking-status',  [BookingsController, 'statusForm']).as('booking.status')
router.post('/booking-status', [BookingsController, 'statusLookup']).as('booking.status.lookup')

// ── Payments ──────────────────────────────────────────────────────────────
router.post('/payments',            [PaymentsController, 'store'])
router.get('/payments/:bookingId',  [PaymentsController, 'show'])

// ── Admin Auth ─────────────────────────────────────────────────────────
router.get('/admin/login',  [AdminSessionController, 'create']).as('admin.login')
router.post('/admin/login', [AdminSessionController, 'store']).as('admin.login.store')
router.post('/admin/logout',[AdminSessionController, 'destroy']).as('admin.logout')

// ── Admin ──────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get('/admin',                [AdminController, 'index']).as('admin')
    router.get('/admin/stats',          [AdminController, 'statsJson']).as('admin.stats')
    router.get('/admin/data',           [AdminController, 'dataJson']).as('admin.data')
    router.get('/admin/reports',        [AdminReportsController, 'index']).as('admin.reports')
    router.get('/admin/profile',        [AdminProfileController, 'index']).as('admin.profile')
    router.post('/admin/profile',       [AdminProfileController, 'update']).as('admin.profile.update')
    router.post('/admin/profile/password', [AdminProfileController, 'password']).as('admin.profile.password')
    router.post('/admin/courts',        [AdminController, 'createCourt'])
    router.patch('/admin/courts/:id',   [AdminController, 'updateCourt'])
    router.delete('/admin/courts/:id',  [AdminController, 'deleteCourt'])
    router.post('/admin/coaches',                          [AdminController, 'createCoach'])
    router.patch('/admin/coaches/:id',                     [AdminController, 'updateCoach'])
    router.put('/admin/coaches/:coachId/schedule',         [AdminController, 'upsertCoachSchedule'])
    router.delete('/admin/coaches/:coachId/schedule/:day', [AdminController, 'deleteCoachSchedule'])
    router.patch('/admin/customers/:id', [AdminController, 'updateCustomer'])
    router.post('/admin/users',          [AdminController, 'createUser'])
    router.patch('/admin/users/:id',     [AdminController, 'updateUser'])
    router.delete('/admin/users/:id',    [AdminController, 'deleteUser'])
    router.post('/admin/tiers',         [AdminController, 'createTier'])
    router.patch('/admin/tiers/:id',    [AdminController, 'updateTier'])
    router.delete('/admin/tiers/:id',   [AdminController, 'deleteTier'])
  })
  .use(middleware.admin())
