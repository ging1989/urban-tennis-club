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
    router.get('login',  [controllers.Session,    'create'])
    router.post('login', [controllers.Session,    'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
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
router.get('/bookings/:id',                  [BookingsController, 'show'])
router.patch('/bookings/:id/status',         [BookingsController, 'updateStatus'])
router.get('/bookings/customer/:customerId', [BookingsController, 'byCustomer'])


// ── Coaches ───────────────────────────────────────────────────────────────
router.get('/coaches',              [CoachesController, 'index'])
router.get('/coaches/:id',          [CoachesController, 'show'])
router.get('/coaches/:id/schedules',[CoachesController, 'schedules'])

// ── Customers ─────────────────────────────────────────────────────────────
router.post('/customers/register',  [CustomersController, 'register'])
router.get('/customers/:id',        [CustomersController, 'show'])
router.patch('/customers/:id/tier', [CustomersController, 'updateTier'])

// ── Payments ──────────────────────────────────────────────────────────────
router.post('/payments',            [PaymentsController, 'store'])
router.get('/payments/:bookingId',  [PaymentsController, 'show'])
