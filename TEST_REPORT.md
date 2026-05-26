# Urban Tennis Club - Test & Error Report

วันที่ตรวจ: 2026-05-26

## สรุปผล

โปรเจกต์ยังไม่พร้อม build production เพราะมี TypeScript syntax error ใน seeder และ lint ยังไม่ผ่านจำนวนมาก นอกจากนี้พบ bug จริงในระบบอัปโหลดสลิปที่ทำให้ชื่อไฟล์ถูกบันทึกเป็น `slip_undefined_...` รวมถึงฐานข้อมูลมี migration history ที่ไม่ตรงกับไฟล์ใน repository

## คำสั่งที่ทดสอบ

| คำสั่ง | ผลลัพธ์ |
| --- | --- |
| `npm run typecheck` | ไม่ผ่าน |
| `npm run build` | ไม่ผ่าน |
| `npm run lint` | ไม่ผ่าน |
| `npm test` | รันได้ แต่ไม่มี test case |
| `node ace migration:status` | รันได้เมื่อเชื่อมต่อ MySQL นอก sandbox และพบ corrupt migrations |

## Error ที่พบ

### 1. TypeScript / Build ไม่ผ่าน

ไฟล์: `database/seeders/booking_seeder.ts`

ตำแหน่ง: บรรทัด 24-25

ปัญหา:

```ts
bookingDate: DateTime.fromISO('2026-04-04')
bookingStart: '14:00:00',
```

ขาด comma หลัง `DateTime.fromISO('2026-04-04')` ทำให้ `npm run typecheck` และ `npm run build` ล้มด้วย error:

```text
database/seeders/booking_seeder.ts(25,9): error TS1005: ',' expected.
```

ข้อเสนอแนะ:

```ts
bookingDate: DateTime.fromISO('2026-04-04'),
bookingStart: '14:00:00',
```

หรือถ้า field `bookingDate` ต้องการชนิด date string ให้ตรวจ model/schema แล้วเลือกใช้รูปแบบให้ตรงกัน

## ฟังก์ชันที่ดูผิดปกติ

### 2. Upload slip สร้างชื่อไฟล์เป็น `undefined`

Route:

```ts
router.post('/bookings/:bookingNumber/slip', [PaymentsController, 'uploadSlip'])
```

Controller:

```ts
const filename = `slip_${params.bookingId}_${Date.now()}.${slip.extname}`
```

ปัญหา:

Route ส่ง parameter ชื่อ `bookingNumber` แต่ controller ใช้ `params.bookingId` ซึ่งไม่มีอยู่ใน route นี้ ทำให้ filename กลายเป็น `slip_undefined_...`

หลักฐานใน repository มีไฟล์ลักษณะนี้อยู่แล้ว:

```text
public/uploads/slips/slip_undefined_1779801992346.png
public/uploads/slips/slip_undefined_1779801542786.png
```

ข้อเสนอแนะ:

ใช้ค่าจาก booking ที่ query มาแล้ว:

```ts
const filename = `slip_${booking.bookingId}_${Date.now()}.${slip.extname}`
```

หรือใช้ `params.bookingNumber` ถ้าต้องการให้ชื่อไฟล์อิง booking number

## Lint

### 3. `npm run lint` ไม่ผ่าน

พบ `681 errors`

กลุ่มปัญหาหลัก:

- `prettier/prettier`: format ไม่ตรง config
- `@unicorn/prefer-number-properties`: ควรใช้ `Number.parseFloat` แทน `parseFloat`
- `@adonisjs/prefer-lazy-controller-import`: route controller import ยังไม่ตรง pattern ที่ eslint config ต้องการ

ไฟล์ที่พบ error จำนวนมาก เช่น:

- `start/routes.ts`
- `app/controllers/admin_controller.ts`
- `app/controllers/admin/reports_controller.ts`
- `app/controllers/admin/coach_reports_controller.ts`
- `app/controllers/admin/courts_controller.ts`

ข้อเสนอแนะ:

เริ่มจากแก้ TypeScript syntax error ก่อน จากนั้นค่อยรัน:

```bash
npm run lint
```

ถ้าต้องการแก้ format เป็นชุด ควรพิจารณารัน formatter/lint fix แยก commit เพราะ diff จะใหญ่

## Tests

### 4. ไม่มี test case จริง

คำสั่ง:

```bash
npm test
```

ผลลัพธ์:

```text
NO TESTS EXECUTED
```

ข้อสรุป:

Test runner ทำงานได้ แต่ในโปรเจกต์ยังไม่มี test case สำหรับตรวจ behavior จริง เช่น booking flow, payment flow, upload slip, admin status update

ข้อเสนอแนะ test ที่ควรเพิ่ม:

- จองสนามสำเร็จแล้วต้องสร้าง `booking_number`
- ห้ามจองเวลาซ้อนกับ booking ที่ confirmed หรือ pending ที่ยังไม่หมดอายุ
- อัปโหลดสลิปแล้วต้องบันทึก `slipUrl` ที่ไม่ใช่ `undefined`
- lookup booking status ด้วย booking number และ phone
- admin verify/reject slip แล้ว payment status เปลี่ยนถูกต้อง

## Database / Migration

### 5. Migration status มี corrupt migrations

คำสั่ง:

```bash
node ace migration:status
```

พบ migration ที่ DB บันทึกว่าเคยรันแล้ว แต่ไฟล์ไม่มีอยู่ใน filesystem:

```text
database/migrations/1776697102672_add_slip_url_to_payments_table
database/migrations/1776700000000_add_slip_verified_to_payments_table
database/migrations/1776780328_drop_unique_from_customers_email
database/migrations/1776781400_add_verified_by_user_id_to_payments_table
```

ผลกระทบ:

- rollback อาจมีปัญหา
- เครื่องใหม่หรือ environment ใหม่อาจสร้าง schema ได้ไม่เหมือน DB ปัจจุบัน
- deploy production เสี่ยงถ้า migration history ไม่ตรงกัน

ข้อเสนอแนะ:

- กู้ไฟล์ migration ที่หายกลับมา ถ้ายังมีใน git history
- หรือสร้าง migration ใหม่ที่ทำให้ schema ปัจจุบันสอดคล้อง แล้วจัดการ history อย่างระวัง
- ตรวจตาราง `adonis_schema` กับไฟล์ใน `database/migrations`

### 6. Migration `down()` ว่าง

ไฟล์:

```text
database/migrations/1776943000000_rebackfill_booking_number_random.ts
```

ปัญหา:

```ts
async down() {}
```

ผลกระทบ:

Rollback migration นี้จะไม่ย้อนค่า `booking_number` กลับ ทำให้ข้อมูลอาจไม่อยู่ในสถานะเดิม

ข้อเสนอแนะ:

ถ้า migration นี้จำเป็นต้อง rollback ได้ ควรออกแบบ `down()` ให้ชัดเจน หรือระบุว่าเป็น one-way migration และหลีกเลี่ยง rollback ใน production

## Worktree Note

ก่อนเริ่มตรวจพบไฟล์นี้ถูกแก้ไขอยู่แล้ว:

```text
resources/views/pages/booking.edge
```

diff ที่เห็นคือมีการลบ duplicate declaration:

```diff
-  const TODAY = '{{ today }}'
-  const CURRENT_HOUR = {{ currentHour }}
```

ไม่ได้แก้ไฟล์นี้ในการตรวจรอบนี้

## ลำดับแนะนำในการแก้

1. แก้ syntax error ใน `database/seeders/booking_seeder.ts`
2. แก้ bug upload slip filename จาก `params.bookingId` เป็น `booking.bookingId` หรือ `params.bookingNumber`
3. จัดการ corrupt migrations ให้ history ตรงกับไฟล์จริง
4. เพิ่ม test case สำหรับ booking/payment/upload slip flow
5. ค่อยจัด lint/format เป็นรอบแยก เพราะจำนวน diff น่าจะมาก

