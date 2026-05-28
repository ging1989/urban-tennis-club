# Urban Tennis Club — Developer Manual

คู่มือสำหรับพนักงานใหม่ที่เข้ามาดูแลโปรเจกต์นี้

---

## 1. Overview

เว็บแอปจองสนามเทนนิส สร้างด้วย **AdonisJS v6** (Node.js framework)

| Layer | Technology |
|-------|-----------|
| Framework | AdonisJS v6 (TypeScript) |
| ORM | Lucid (built-in ของ Adonis) |
| Database | MySQL |
| Template engine | Edge.js |
| Auth | `@adonisjs/auth` + session |
| Date/Time | Luxon (ใช้ timezone Asia/Bangkok ทั่วระบบ) |

---

## 2. คำสั่งที่ใช้บ่อย

```bash
# Start development server (auto-reload)
npm run dev

# Type check (ไม่ compile จริง)
npm run typecheck

# Build สำหรับ production
npm run build

# Run migrations ทั้งหมด
node ace migration:run

# Rollback migration ล่าสุด
node ace migration:rollback

# ดู migration status
node ace migration:status

# Run seeder
node ace db:seed --files=database/seeders/admin_seeder.ts

# Reset admin password (ถ้า login ไม่ได้)
node ace db:seed --files=database/seeders/admin_seeder.ts
```

**Admin credentials (default):**
- Email: `admin@urbantennis.com`
- Password: `Admin1234`

---

## 3. โครงสร้างไฟล์หลัก

```
app/
  controllers/          — request handlers
    admin_controller.ts — JSON API สำหรับ admin SPA (courts/coaches/users/tiers)
    admin/              — sub-page controllers (reports, slips, bookings, settings)
    bookings_controller.ts
    payments_controller.ts
    home_controller.ts
  models/               — Lucid ORM models (1 ไฟล์ต่อ 1 ตาราง)
  middleware/           — auth guards

start/
  routes.ts             — route definitions ทั้งหมด

resources/views/
  layouts/
    master.edge         — layout หลักสำหรับหน้า user
    admin.edge          — layout หลักสำหรับหน้า admin
  pages/
    home.edge           — หน้าแรก (timeslot grid)
    booking.edge        — หน้าจอง (4-step wizard)
    booking_confirmation.edge
    admin.edge          — Admin SPA (single page, ~2500 บรรทัด)
    admin/              — Admin sub-pages

database/
  migrations/           — สร้าง/แก้ schema
  seeders/              — ข้อมูลตั้งต้น

public/
  css/                  — stylesheet
  uploads/slips/        — ไฟล์สลิปที่ user อัปโหลด
```

---

## 4. Database Schema & ความสัมพันธ์

### ตารางทั้งหมด

```
tiers           — ระดับสมาชิก (Bronze/Silver/Gold)
customers       — ข้อมูลลูกค้า (ทั้ง guest และ member)
courts          — ข้อมูลสนาม
coach_pricings  — ระดับและราคาโค้ช
coaches         — ข้อมูลโค้ช
coach_schedules — ตารางสอนโค้ช (วัน/เวลา)
bookings        — ข้อมูลการจอง
payments        — ข้อมูลการชำระเงิน
users           — บัญชีผู้ใช้ (admin / member)
```

### ER Diagram (text)

```
tiers ──────────────< customers >──────── users
                          │
                          │ (customerId)
                          ▼
courts ──────────────< bookings >──────── coach_schedules >──── coaches >──── coach_pricings
                          │
                          │ (bookingId)
                          ▼
                       payments
```

### ความสัมพันธ์โดยละเอียด

| Model | Relation | Model อื่น | Foreign Key |
|-------|----------|-----------|-------------|
| `Customer` | belongsTo | `Tier` | `tier_id` |
| `Customer` | belongsTo | `User` | `user_id` |
| `Customer` | hasMany | `Booking` | `customer_id` |
| `Booking` | belongsTo | `Customer` | `customer_id` |
| `Booking` | belongsTo | `Court` | `court_id` |
| `Booking` | belongsTo | `CoachSchedule` | `schedule_id` |
| `Booking` | hasOne | `Payment` | `booking_id` |
| `CoachSchedule` | belongsTo | `Coach` | `coach_id` |
| `Coach` | belongsTo | `CoachPricing` | `coach_level_id` |
| `User` | hasOne | `Customer` | `user_id` |
| `Tier` | hasMany | `Customer` | `tier_id` |

### หมายเหตุสำคัญ

- **guest vs member** — `customers.customer_type` = `'guest'` หรือ `'member'`
  - guest: ไม่มี user account, ใส่ชื่อ/โทรศัพท์เองตอนจอง
  - member: มี `user_id` ที่ link กับตาราง `users`
- **booking_number** — format `yyMMdd` + random 4 หลัก เช่น `2605281234` (ใช้แทน sequential ID ทุกที่ที่ user เห็น)
- **booking expiry** — pending booking หมดอายุใน 30 นาที → ระบบ auto-cancel เมื่อ admin เปิดหน้า dashboard

---

## 5. การใช้ Lucid ORM

### Query พื้นฐาน

```ts
// หาทั้งหมด
const courts = await Court.all()

// หาด้วย primary key (throw 404 ถ้าไม่เจอ)
const court = await Court.findOrFail(id)

// หาด้วย field อื่น
const user = await User.findBy('email', 'admin@example.com')

// Query builder
const bookings = await Booking.query()
  .where('booking_status', 'confirmed')
  .orderBy('booking_date', 'desc')
  .limit(10)
```

### Preload (JOIN ข้อมูลจาก relation)

```ts
// preload relation เดียว
const booking = await Booking.query()
  .preload('customer')
  .preload('court')
  .firstOrFail()

// เข้าถึงข้อมูลที่ preload แล้ว
console.log(booking.customer.customerName)
console.log(booking.court.courtName)

// nested preload (โค้ชและราคา)
const schedule = await CoachSchedule.query()
  .preload('coach', (q: any) => q.preload('coachPricing'))
  .firstOrFail()
```

> **หมายเหตุ:** nested preload ที่มี circular model dependency ต้องใช้ `(q: any)` เพื่อหลีกเลี่ยง TypeScript error

### Create / Update / Delete

```ts
// Create
const booking = await Booking.create({
  customerId: 1,
  courtId: 2,
  bookingDate: DateTime.now(),
  bookingStart: '10:00',
  bookingEnd: '12:00',
  totalPrice: 600,
  bookingStatus: 'pending',
})

// Update
booking.bookingStatus = 'confirmed'
await booking.save()

// หรือใช้ merge แล้ว save
court.merge({ courtName: 'Court A', courtPricePerHr: 400 })
await court.save()

// Delete
await court.delete()
```

### Transaction (ใช้ตอนจอง — ป้องกัน race condition)

```ts
const trx = await db.transaction()
try {
  const booking = await Booking.create({ ... }, { client: trx })
  const payment = await Payment.create({ ... }, { client: trx })
  await trx.commit()
} catch (error) {
  await trx.rollback()
}
```

### Raw Query

```ts
// ใช้ whereRaw สำหรับ SQL ที่ query builder ทำไม่ได้
await Booking.query()
  .whereRaw('DATE(booking_date) = ?', [dateString])
```

---

## 6. Booking Flow (User)

```
1. หน้าแรก (/)
   └── เห็น timeslot grid ของแต่ละสนาม วันนี้เท่านั้น
       └── กด slot → ไป /bookings/new?courtId=X&date=Y&start=HH:00

2. หน้าจอง (/bookings/new)
   Step 1: เลือกวันและ time slot (สูงสุด 3 slot ติดกัน)
   Step 2: เลือกโค้ช (optional)
   Step 3: กรอกชื่อ/โทรศัพท์/อีเมล (member ใช้ข้อมูลจาก profile อัตโนมัติ)
   Step 4: เลือกวิธีชำระเงิน (QR / โอนเงิน) → Submit

3. POST /bookings → BookingsController.store
   - ตรวจ conflict (slot ซ้อนกัน)
   - ตรวจวันผ่านแล้วหรือไม่
   - ตรวจ booking_start < booking_end
   - ตรวจ time slot ผ่านแล้วหรือไม่ (ถ้าเป็นวันนี้)
   - สร้าง Booking (status: pending) + Payment (status: pending) ใน transaction
   - Redirect → /bookings/{bookingNumber}/confirmation

4. หน้า Confirmation
   - แสดง timer 30 นาที
   - User อัปโหลดสลิป → POST /bookings/{bookingNumber}/slip
   - Timer poll ทุก 5 วินาที → ถ้า admin verify แล้ว timer หยุด แสดง "Confirmed"
```

---

## 7. Payment & Slip Flow

```
User อัปโหลดสลิป
  └── POST /bookings/:bookingNumber/slip
      └── payments_controller.uploadSlip
          - ค้นหา booking จาก bookingNumber (ไม่ใช่ sequential ID)
          - บันทึกไฟล์ที่ public/uploads/slips/slip_{bookingId}_{timestamp}.ext
          - อัปเดต payment.slipUrl และ payment.paymentStatus = 'slip_uploaded'

Admin ตรวจสลิป (/admin/slips)
  └── กด Verify → POST /admin/slips/:paymentId/verify
      - payment.paymentStatus = 'paid'
      - booking.bookingStatus = 'confirmed'
      - คำนวณ total hours → อัปเดต tier อัตโนมัติ

  └── กด Reject → POST /admin/slips/:paymentId/reject
      - payment.paymentStatus = 'rejected'
```

---

## 8. Admin System

### Two-tier admin architecture

| ส่วน | URL | ไฟล์ |
|-----|-----|------|
| Admin SPA (main) | `/admin` | `pages/admin.edge` + `admin_controller.ts` |
| Admin sub-pages | `/admin/bookings`, `/admin/reports`, ฯลฯ | `pages/admin/*.edge` + `controllers/admin/*.ts` |

- **Admin SPA** ใช้ `fetch()` call JSON API (PATCH/DELETE) และ `setInterval` refresh ทุก 30 วินาที
- **Sub-pages** ใช้ server-side render ปกติ, ทั้งหมดใช้ `@layout('layouts/admin')`
- Middleware `admin()` guard ทุก route ใน group

### Auto-expire bookings

`AdminController.index` เรียก `autoExpireBookings()` ทุกครั้งที่ admin โหลด dashboard — pending booking ที่เกิน 30 นาทีจะถูก cancel อัตโนมัติ

---

## 9. Authentication

### Member login

- ใช้ `@adonisjs/auth` session-based
- `User` model ใช้ `withAuthFinder` mixin — hash password ด้วย **scrypt** ผ่าน `beforeSave` hook อัตโนมัติ
- **สำคัญ:** อย่า hash password ก่อน assign ให้ `user.password` เพราะจะถูก hash ซ้ำ (double-hash)

```ts
// ถูก — ให้ beforeSave hook hash เอง
user.password = 'newpassword'
await user.save()

// ผิด — hash ซ้ำ login ไม่ได้
user.password = await hash.make('newpassword')
await user.save()
```

### Admin login

- Session แยกจาก member — ใช้ `admin_session_controller.ts`
- Middleware `middleware.admin()` ตรวจ session ทุก request

---

## 10. Tier System (ระดับสมาชิก)

Tier จะถูกคำนวณ/อัปเดตอัตโนมัติใน 2 จุด:
1. `PaymentsController.store` — เมื่อ payment สำเร็จ
2. `AdminSlipsController.verify` — เมื่อ admin verify สลิป

```
totalHours = ผลรวมชั่วโมงจาก bookings ที่ status = 'confirmed'
newTier = tier ที่มี minHours ≤ totalHours (เรียงจากมากไปน้อย)
```

---

## 11. Timezone

ใช้ `Asia/Bangkok` ทั่วระบบ ทั้งใน controller และ JS ฝั่ง client

```ts
// Server (controller)
const now = DateTime.now().setZone('Asia/Bangkok')
const today = now.toISODate()      // "2026-05-28"
const hour  = now.hour             // 14

// Template → JS (ส่งเป็น variable ให้ client)
const TODAY = '{{ today }}'
const CURRENT_HOUR = {{ currentHour }}
```

---

## 12. Migration

การแก้ schema ทำผ่าน migration เท่านั้น — **อย่าแก้ database ตรงๆ**

```bash
# สร้าง migration ใหม่
node ace make:migration add_column_to_table

# รัน migration ที่ยังไม่ได้รัน
node ace migration:run

# Rollback 1 batch ล่าสุด
node ace migration:rollback
```

ตัวอย่าง migration:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bookings', (table) => {
      table.string('booking_number').nullable()
    })
  }

  async down() {
    this.schema.alterTable('bookings', (table) => {
      table.dropColumn('booking_number')
    })
  }
}
```

> **หมายเหตุ:** มี migration บางไฟล์ที่ DB บันทึกว่ารันแล้วแต่ไม่มีในระบบ (corrupt history) ระวังเวลา rollback หรือ deploy ใหม่

---

## 13. สิ่งที่ต้องระวัง

| เรื่อง | รายละเอียด |
|-------|-----------|
| `booking_number` | ใช้แทน sequential `booking_id` เสมอเวลาส่งให้ user เห็น — ป้องกัน IDOR |
| Conflict check | ใช้ transaction ตอนสร้าง booking เพื่อป้องกัน race condition |
| Past slot | ตรวจทั้ง client (JS) และ server (controller) |
| `toSQL()` | Luxon `.toSQL()` return `string \| null` — ต้องใส่ `!` เมื่อ pass เข้า query |
| circular model | `Coach ↔ CoachSchedule ↔ Coach → CoachPricing → Coach` — nested preload ต้องใช้ `(q: any)` |
| Timer | หน้า confirmation ตรวจ `#timer` element ก่อนรัน countdown — ถ้า confirmed แล้ว element จะไม่ถูก render |
