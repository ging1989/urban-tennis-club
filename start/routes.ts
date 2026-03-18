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
import CourtsController from '#controllers/courts_controller'
import router from '@adonisjs/core/services/router'
import BookingsController from '#controllers/bookings_controller'
import CoachesController from '#controllers/coaches_controller'
import CustomersController from '#controllers/customers_controller'
import PaymentsController from '#controllers/payments_controller'
import HomeController from '#controllers/home_controller'

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

router.get('/', [HomeController, 'index']).as('home')

router.get('/courts', [CourtsController, 'index'])
router.get('/courts/:id', [CourtsController, 'show'])
router.get('/courts/:id/availability', [CourtsController, 'availability'])

router.post('/bookings', [BookingsController, 'store'])
router.get('/bookings/:id', [BookingsController, 'show'])
router.patch('/bookings/:id/status', [BookingsController, 'updateStatus'])
router.get('/bookings/customer/:customerId', [BookingsController, 'byCustomer'])
router.get('/booking', [CourtsController, 'booking'])


router.get('/coaches', [CoachesController, 'index'])
router.get('/coaches/:id', [CoachesController, 'show'])
router.get('/coaches/:id/schedules', [CoachesController, 'schedules'])

router.post('/customers/register', [CustomersController, 'register'])
router.get('/customers/:id', [CustomersController, 'show'])
router.patch('/customers/:id/tier', [CustomersController, 'updateTier'])

router.post('/payments', [PaymentsController, 'store'])
router.get('/payments/:bookingId', [PaymentsController, 'show'])
