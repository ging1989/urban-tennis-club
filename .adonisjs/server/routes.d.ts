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
    'bookings.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bookings.by_customer': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'coaches.index': { paramsTuple?: []; params?: {} }
    'coaches.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coaches.schedules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.register': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.update_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'payments.store': { paramsTuple?: []; params?: {} }
    'payments.show': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
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
    'coaches.index': { paramsTuple?: []; params?: {} }
    'coaches.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coaches.schedules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'payments.show': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
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
    'coaches.index': { paramsTuple?: []; params?: {} }
    'coaches.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coaches.schedules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'payments.show': { paramsTuple: [ParamValue]; params: {'bookingId': ParamValue} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'bookings.store': { paramsTuple?: []; params?: {} }
    'customers.register': { paramsTuple?: []; params?: {} }
    'payments.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'bookings.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.update_tier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}