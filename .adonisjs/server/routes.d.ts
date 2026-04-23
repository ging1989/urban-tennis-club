import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'courts.index': { paramsTuple?: []; params?: {} }
    'courts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'courts.availability': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.new': { paramsTuple?: []; params?: {} }
    'bookings.confirmation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.store': { paramsTuple?: []; params?: {} }
    'bookings.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.by_customer': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'member.profile': { paramsTuple?: []; params?: {} }
    'member.profile.update': { paramsTuple?: []; params?: {} }
    'coaches.index': { paramsTuple?: []; params?: {} }
    'coaches.busy': { paramsTuple?: []; params?: {} }
    'coaches.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coaches.schedules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.register': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.update_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'booking.status': { paramsTuple?: []; params?: {} }
    'booking.status.lookup': { paramsTuple?: []; params?: {} }
    'payments.store': { paramsTuple?: []; params?: {} }
    'payments.show': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
    'payments.upload_slip': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
    'bookings.check_payment_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.login': { paramsTuple?: []; params?: {} }
    'admin.login.store': { paramsTuple?: []; params?: {} }
    'admin.logout': { paramsTuple?: []; params?: {} }
    'admin': { paramsTuple?: []; params?: {} }
    'admin.stats': { paramsTuple?: []; params?: {} }
    'admin.data': { paramsTuple?: []; params?: {} }
    'admin.bookings': { paramsTuple?: []; params?: {} }
    'admin.bookings.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.courts': { paramsTuple?: []; params?: {} }
    'admin.courts.create': { paramsTuple?: []; params?: {} }
    'admin.courts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.reports': { paramsTuple?: []; params?: {} }
    'admin.reports.coaches': { paramsTuple?: []; params?: {} }
    'admin.slips': { paramsTuple?: []; params?: {} }
    'admin.slips.verify': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.slips.reject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.profile': { paramsTuple?: []; params?: {} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
    'admin.profile.password': { paramsTuple?: []; params?: {} }
    'admin.courts.store': { paramsTuple?: []; params?: {} }
    'admin.courts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.courts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.create_coach': { paramsTuple?: []; params?: {} }
    'admin.update_coach': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.upsert_coach_schedule': { paramsTuple: [ParamValue]; params: {'coachId': ParamValue} }
    'admin.delete_coach_schedule': { paramsTuple: [ParamValue,ParamValue]; params: {'coachId': ParamValue,'day': ParamValue} }
    'admin.update_customer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.create_user': { paramsTuple?: []; params?: {} }
    'admin.update_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.delete_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.create_tier': { paramsTuple?: []; params?: {} }
    'admin.update_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.delete_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'courts.index': { paramsTuple?: []; params?: {} }
    'courts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'courts.availability': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.new': { paramsTuple?: []; params?: {} }
    'bookings.confirmation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.by_customer': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'member.profile': { paramsTuple?: []; params?: {} }
    'coaches.index': { paramsTuple?: []; params?: {} }
    'coaches.busy': { paramsTuple?: []; params?: {} }
    'coaches.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coaches.schedules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'booking.status': { paramsTuple?: []; params?: {} }
    'payments.show': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
    'bookings.check_payment_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.login': { paramsTuple?: []; params?: {} }
    'admin': { paramsTuple?: []; params?: {} }
    'admin.stats': { paramsTuple?: []; params?: {} }
    'admin.data': { paramsTuple?: []; params?: {} }
    'admin.bookings': { paramsTuple?: []; params?: {} }
    'admin.courts': { paramsTuple?: []; params?: {} }
    'admin.courts.create': { paramsTuple?: []; params?: {} }
    'admin.courts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.reports': { paramsTuple?: []; params?: {} }
    'admin.reports.coaches': { paramsTuple?: []; params?: {} }
    'admin.slips': { paramsTuple?: []; params?: {} }
    'admin.profile': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'courts.index': { paramsTuple?: []; params?: {} }
    'courts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'courts.availability': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.new': { paramsTuple?: []; params?: {} }
    'bookings.confirmation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.by_customer': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'member.profile': { paramsTuple?: []; params?: {} }
    'coaches.index': { paramsTuple?: []; params?: {} }
    'coaches.busy': { paramsTuple?: []; params?: {} }
    'coaches.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coaches.schedules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'booking.status': { paramsTuple?: []; params?: {} }
    'payments.show': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
    'bookings.check_payment_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.login': { paramsTuple?: []; params?: {} }
    'admin': { paramsTuple?: []; params?: {} }
    'admin.stats': { paramsTuple?: []; params?: {} }
    'admin.data': { paramsTuple?: []; params?: {} }
    'admin.bookings': { paramsTuple?: []; params?: {} }
    'admin.courts': { paramsTuple?: []; params?: {} }
    'admin.courts.create': { paramsTuple?: []; params?: {} }
    'admin.courts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.reports': { paramsTuple?: []; params?: {} }
    'admin.reports.coaches': { paramsTuple?: []; params?: {} }
    'admin.slips': { paramsTuple?: []; params?: {} }
    'admin.profile': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'bookings.store': { paramsTuple?: []; params?: {} }
    'member.profile.update': { paramsTuple?: []; params?: {} }
    'customers.register': { paramsTuple?: []; params?: {} }
    'booking.status.lookup': { paramsTuple?: []; params?: {} }
    'payments.store': { paramsTuple?: []; params?: {} }
    'payments.upload_slip': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
    'admin.login.store': { paramsTuple?: []; params?: {} }
    'admin.logout': { paramsTuple?: []; params?: {} }
    'admin.bookings.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.slips.verify': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.slips.reject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
    'admin.profile.password': { paramsTuple?: []; params?: {} }
    'admin.courts.store': { paramsTuple?: []; params?: {} }
    'admin.create_coach': { paramsTuple?: []; params?: {} }
    'admin.create_user': { paramsTuple?: []; params?: {} }
    'admin.create_tier': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'bookings.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.update_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.courts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.update_coach': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.update_customer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.update_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.update_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.courts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.delete_coach_schedule': { paramsTuple: [ParamValue,ParamValue]; params: {'coachId': ParamValue,'day': ParamValue} }
    'admin.delete_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.delete_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'admin.upsert_coach_schedule': { paramsTuple: [ParamValue]; params: {'coachId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}