# Alarm & Maintenance Management System

ระบบเว็บสำหรับโรงงานเพื่อบันทึกและติดตาม **เครื่องจักร (Machine)**, **Alarm** และ **งานซ่อมบำรุง (Maintenance)**
ในที่เดียว จำกัดสิทธิ์ตามบทบาทของผู้ใช้ และสรุปภาพรวมบน Dashboard

พัฒนาเป็นโปรเจ็คของนักศึกษา 2 คน รายละเอียดความต้องการทั้งหมดอยู่ที่ [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)

**เว็บที่ใช้งานได้จริง:** <https://automation-web-app.vercel.app>

## สารบัญ

- [วัตถุประสงค์](#วัตถุประสงค์)
- [Function หลัก](#function-หลัก) และ [Technology](#technology)
- [Screenshots](#screenshots)
- [Database Structure](#database-structure)
- [วิธีติดตั้งและใช้งาน](#วิธีติดตั้งและใช้งาน)
- [Vercel URL](#vercel-url)
- [การใช้ AI](#การใช้-ai)

## วัตถุประสงค์

ข้อมูล Alarm และงานซ่อมในโรงงานมักกระจายอยู่ในกระดาษ, Excel และแชท ทำให้ค้นประวัติยาก ติดตามสถานะงานไม่ชัด
และแต่ละคนเห็นข้อมูลไม่ตรงกัน ระบบนี้จึงมีเป้าหมายเพื่อ

- ลดเวลาค้นหาประวัติ Alarm และงานซ่อมของเครื่องจักรแต่ละเครื่อง
- ให้ทุกคนเห็นสถานะเครื่องและงานค้างจากแหล่งข้อมูลเดียวกัน
- ระบุได้ว่าใครเปลี่ยนแปลงข้อมูลสำคัญ (เช่น ปิด Alarm, บันทึกงานซ่อม) และเมื่อไร

## Function หลัก

| ฟังก์ชัน | รายละเอียด |
|---|---|
| Login / Logout | เข้าสู่ระบบด้วย Email และ Password (Supabase Auth) บัญชีสร้างโดย Admin |
| Role-based Access | Admin, Technician และ Viewer (อ่านอย่างเดียว) เข้าถึงหน้าและทำรายการได้ต่างกัน ตรวจสิทธิ์ทั้งที่ Server และ Database (RLS) |
| Machine Master | เพิ่ม / ดู / แก้ไข / ลบ เครื่องจักร (Admin) Machine ID ห้ามซ้ำ ลบเครื่องที่มี Alarm หรือ Maintenance ผูกอยู่ไม่ได้ |
| Alarm Record | สร้าง Alarm และเปลี่ยนสถานะ Open → In Progress → Closed ปิดได้เมื่อมี Cause และ Action Taken ครบ และบันทึกผู้ปิดกับเวลาที่ปิด |
| Maintenance Record | บันทึกปัญหาและการซ่อมของแต่ละเครื่อง ผูกกับ Alarm ต้นเหตุของเครื่องเดียวกันได้ (ไม่บังคับ) สถานะ Pending / In Progress / Completed Technician บันทึกในชื่อของตนเองเท่านั้น |
| Search / Filter | ค้นหาและกรองในหน้ารายการ **Machines:** รหัสหรือชื่อ, สถานะ, ประเภท · **Alarms:** เครื่อง, สถานะ, รหัส Alarm, ช่วงวันที่เกิด · **Maintenance:** เครื่อง, สถานะ, Technician, ช่วงวันที่เริ่ม ใช้หลายเงื่อนไขพร้อมกันได้ เก็บค่าใน URL แบ่งหน้าละ 20 รายการ ช่วงวันที่ของ Alarm นับตามวันเวลาไทย |
| Export CSV | ปุ่ม Export CSV ในหน้า Alarms และ Maintenance ได้ไฟล์ตามตัวกรองที่เลือกอยู่ (สูงสุด 5,000 แถว ถ้าเกินจะมีคำว่า `-partial` ในชื่อไฟล์) เปิดใน Excel แล้วภาษาไทยถูกต้อง และกันไม่ให้ Excel คำนวณข้อความที่ขึ้นต้นด้วย `=` (CSV injection) |
| Dashboard | สรุปจำนวนเครื่องแยกตามสถานะ, Alarm ที่ยังไม่ปิด, งานซ่อมที่ยังไม่เสร็จ และ Alarm ล่าสุด กดตัวเลขหรือแถวสถานะเพื่อไปหน้ารายการที่กรองไว้ ถ้าโหลดข้อมูลไม่ได้จะแสดงข้อความ Error ไม่ใช่ตัวเลขผิด |
| User Management | Admin ดูรายชื่อผู้ใช้และเปลี่ยน Role ของผู้อื่น ทุกคนแก้ชื่อของตนเองได้ที่หน้า Profile แต่เปลี่ยน Role ของตนเองไม่ได้ |
| Dark mode | ปุ่ม Light / Dark / System ใน Navbar จำค่าที่เลือกไว้ในเบราว์เซอร์ ไม่มีหน้าขาวแวบก่อนเข้าโหมดมืด และตามค่าของเครื่องเมื่อเลือก System |
| Responsive | ใช้งานได้ตั้งแต่จอ 360 px: รายการเป็นการ์ดบนจอเล็กและเป็นตารางบนจอกว้าง เมนูพับเมื่อจอแคบ |

### Role และสิทธิ์โดยสรุป

| ความสามารถ | Admin | Technician | Viewer |
|---|:-:|:-:|:-:|
| ดู Dashboard, Machine, Alarm, Maintenance | ✅ | ✅ | ✅ |
| เพิ่ม / แก้ไข / ลบ Machine | ✅ | ❌ | ❌ |
| สร้าง / แก้ไขรายละเอียด Alarm | ✅ | ❌ | ❌ |
| เปลี่ยนสถานะ Alarm | ✅ | ✅ | ❌ |
| สร้าง Maintenance Record | ✅ | ✅ (ในชื่อของตนเองเท่านั้น) | ❌ |
| แก้ไข Maintenance Record | ทุกรายการ | เฉพาะที่ตนรับผิดชอบ | ❌ |
| Export CSV (Alarm, Maintenance) | ✅ | ✅ | ✅ |
| จัดการ User และเปลี่ยน Role ของผู้อื่น | ✅ | ❌ | ❌ |
| แก้ชื่อที่แสดงของตนเอง | ✅ | ✅ | ✅ |
| เปลี่ยน Role ของตนเอง | ❌ | ❌ | ❌ |

Viewer ใช้กับผู้ที่ต้องดูภาพรวมอย่างเดียว เช่น ผู้จัดการฝ่ายผลิต Admin ตั้ง Role นี้ที่หน้า Users และจะมอบงานซ่อมให้ Viewer ไม่ได้

ตารางเต็มและกฎทางธุรกิจอยู่ใน [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)

## Technology

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend / Backend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (รองรับโหมดมืดด้วย class `dark`) |
| Validation | Zod ตรวจข้อมูลทั้งฝั่ง client และ server ด้วย schema เดียวกัน และมี constraint ใน Database อีกชั้น |
| Database / Auth | Supabase (PostgreSQL, Supabase Auth, Row Level Security) ผ่าน `@supabase/supabase-js` และ `@supabase/ssr` |
| Testing | Vitest |
| CI | GitHub Actions (lint, build, test) |
| Hosting | Vercel |

## Screenshots

รูปด้านล่างถ่ายจากแอปที่รันในเครื่องด้วยข้อมูลตัวอย่างชุดเดียวกับ `supabase/seed.sql` (ชื่อบัญชีและอีเมลเป็นข้อมูลสมมติ) ไม่ได้ถ่ายจาก Database จริงบน Vercel
ทุกรูปมีทั้งโหมด Light และ Dark รูปทั้งหมด (ทุกหน้า, จอ 1280 px และ 360 px, มุมมองของ Technician และ Viewer) อยู่ในโฟลเดอร์ [docs/screenshots/](docs/screenshots/)

| หน้า | Light | Dark |
|---|---|---|
| Login | <img src="docs/screenshots/login-light.png" alt="login (light)" width="420"> | <img src="docs/screenshots/login-dark.png" alt="login (dark)" width="420"> |
| Dashboard | <img src="docs/screenshots/dashboard-light.png" alt="dashboard (light)" width="420"> | <img src="docs/screenshots/dashboard-dark.png" alt="dashboard (dark)" width="420"> |
| Machines | <img src="docs/screenshots/machines-light.png" alt="machines (light)" width="420"> | <img src="docs/screenshots/machines-dark.png" alt="machines (dark)" width="420"> |
| Alarms (กรองสถานะ Open) | <img src="docs/screenshots/alarms-filtered-light.png" alt="alarms-filtered (light)" width="420"> | <img src="docs/screenshots/alarms-filtered-dark.png" alt="alarms-filtered (dark)" width="420"> |
| รายละเอียด Alarm และฟอร์มเปลี่ยนสถานะ | <img src="docs/screenshots/alarm-detail-open-light.png" alt="alarm-detail-open (light)" width="420"> | <img src="docs/screenshots/alarm-detail-open-dark.png" alt="alarm-detail-open (dark)" width="420"> |
| Maintenance | <img src="docs/screenshots/maintenance-light.png" alt="maintenance (light)" width="420"> | <img src="docs/screenshots/maintenance-dark.png" alt="maintenance (dark)" width="420"> |
| ฟอร์มแสดง Error ใต้ช่องที่ผิด | <img src="docs/screenshots/machine-new-errors-light.png" alt="machine-new-errors (light)" width="420"> | <img src="docs/screenshots/machine-new-errors-dark.png" alt="machine-new-errors (dark)" width="420"> |
| Users (Admin) | <img src="docs/screenshots/users-light.png" alt="users (light)" width="420"> | <img src="docs/screenshots/users-dark.png" alt="users (dark)" width="420"> |
| Viewer ถูกปฏิเสธเมื่อเปิดหน้าที่ไม่มีสิทธิ์ | <img src="docs/screenshots/viewer-forbidden-light.png" alt="viewer-forbidden (light)" width="420"> | <img src="docs/screenshots/viewer-forbidden-dark.png" alt="viewer-forbidden (dark)" width="420"> |
| จอ 360 px: รายการ Alarm เป็นการ์ด | <img src="docs/screenshots/alarms-mobile-light.png" alt="alarms-mobile (light)" width="240"> | <img src="docs/screenshots/alarms-mobile-dark.png" alt="alarms-mobile (dark)" width="240"> |
| จอ 360 px: เมนูที่พับ | <img src="docs/screenshots/menu-mobile-light.png" alt="menu-mobile (light)" width="240"> | <img src="docs/screenshots/menu-mobile-dark.png" alt="menu-mobile (dark)" width="240"> |

## Database Structure

ฐานข้อมูลเป็น PostgreSQL บน Supabase มี 4 ตารางใน schema `public` สร้างจากไฟล์ใน
[`supabase/migrations/`](supabase/migrations/) และเปิด Row Level Security (RLS) ทุกตาราง

### ความสัมพันธ์

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1"
    MACHINES ||--o{ ALARMS : "มี"
    MACHINES ||--o{ MAINTENANCE_RECORDS : "มี"
    ALARMS |o--o{ MAINTENANCE_RECORDS : "เป็นต้นเหตุของ"
    PROFILES ||--o{ MAINTENANCE_RECORDS : "รับผิดชอบ (technician_id)"
    PROFILES |o--o{ ALARMS : "สร้าง / ปิด"
```

- `profiles` 1:1 กับ `auth.users` ของ Supabase Auth สร้างอัตโนมัติด้วย trigger เมื่อเพิ่มผู้ใช้ และลบตามเมื่อลบผู้ใช้
- `machines` 1:N `alarms` และ 1:N `maintenance_records` ลบเครื่องที่ยังมี Alarm หรืองานซ่อมไม่ได้ (`on delete restrict`)
- `maintenance_records` อ้าง Alarm ต้นเหตุได้ (ไม่บังคับ) ผ่าน foreign key คู่ `(alarm_id, machine_id)`
  จึงอ้างได้เฉพาะ Alarm ของเครื่องเดียวกัน (BR-MNT-03)
- `alarms.created_by`, `alarms.closed_by` และ `maintenance_records.created_by` ชี้ไปที่ `profiles` เพื่อบอกว่าใครทำ

### ตาราง

**`profiles`** — ชื่อและ Role ของผู้ใช้แต่ละคน

| คอลัมน์ | ชนิด | เงื่อนไข |
|---|---|---|
| `id` | uuid | PK, FK → `auth.users.id` |
| `full_name` | text | 1–100 ตัวอักษร |
| `role` | `app_role` | `admin` / `technician` / `viewer` ค่าเริ่มต้น `technician` |
| `created_at`, `updated_at` | timestamptz | อัปเดต `updated_at` อัตโนมัติ |

**`machines`** — ข้อมูลหลักของเครื่องจักร

| คอลัมน์ | ชนิด | เงื่อนไข |
|---|---|---|
| `id` | uuid | PK |
| `machine_code` | text | Machine ID ที่ผู้ใช้เห็น ห้ามซ้ำ รูปแบบ `^[A-Z]{1,4}-[0-9]{3,5}$` เช่น `M-001` |
| `name` | text | 1–100 ตัวอักษร |
| `type` | text | 1–50 ตัวอักษร |
| `location` | text | 1–100 ตัวอักษร |
| `status` | `machine_status` | `Running` / `Stop` / `Alarm` / `Maintenance` |
| `created_at`, `updated_at` | timestamptz | |

**`alarms`** — Alarm ของเครื่องจักร ไม่มีการลบ

| คอลัมน์ | ชนิด | เงื่อนไข |
|---|---|---|
| `id` | uuid | PK |
| `machine_id` | uuid | FK → `machines.id` |
| `alarm_code` | text | รูปแบบ `^[A-Z0-9-]{2,20}$` เช่น `E-101` |
| `description` | text | 1–500 ตัวอักษร |
| `occurred_at` | timestamptz | ห้ามอยู่ในอนาคต (เผื่อ 5 นาที) |
| `cause` | text | ไม่บังคับ ≤ 500 ตัวอักษร |
| `action_taken` | text | ไม่บังคับ ≤ 1000 ตัวอักษร |
| `status` | `alarm_status` | `Open` / `In Progress` / `Closed` ค่าเริ่มต้น `Open` |
| `created_by` | uuid | FK → `profiles.id` ผู้สร้าง |
| `closed_by`, `closed_at` | uuid, timestamptz | ผู้ปิดและเวลาที่ปิด ใส่โดย trigger |
| `created_at`, `updated_at` | timestamptz | |

**`maintenance_records`** — งานซ่อมบำรุง ไม่มีการลบ

| คอลัมน์ | ชนิด | เงื่อนไข |
|---|---|---|
| `id` | uuid | PK |
| `machine_id` | uuid | FK → `machines.id` |
| `alarm_id` | uuid | ไม่บังคับ FK คู่ `(alarm_id, machine_id)` → `alarms` |
| `technician_id` | uuid | FK → `profiles.id` Technician ผู้รับผิดชอบ |
| `type` | `maintenance_type` | `Corrective` (ซ่อมเมื่อเสีย) / `Preventive` (บำรุงรักษาตามรอบ) |
| `problem` | text | 1–1000 ตัวอักษร |
| `action_taken` | text | ไม่บังคับ ≤ 1000 ตัวอักษร |
| `status` | `maintenance_status` | `Pending` / `In Progress` / `Completed` ค่าเริ่มต้น `Pending` |
| `start_date`, `end_date` | date | `end_date` ไม่บังคับ และต้องไม่ก่อน `start_date` |
| `created_by` | uuid | FK → `profiles.id` ผู้บันทึก แก้ภายหลังไม่ได้ |
| `created_at`, `updated_at` | timestamptz | |

### กฎที่ฐานข้อมูลบังคับเอง

นอกจากการตรวจในฟอร์มและ Server Action แล้ว ฐานข้อมูลบังคับกฎสำคัญซ้ำอีกชั้น
จึงเลี่ยงไม่ได้แม้เรียก API ของ Supabase โดยตรง

| กฎ | บังคับด้วย |
|---|---|
| Machine ID ห้ามซ้ำ (REQ-MCH-03) | `unique` + `check` ตัวพิมพ์ใหญ่ |
| ปิด Alarm ต้องมี Cause และ Action Taken (BR-ALM-03) | check `alarms_closed_requires_details` |
| ลำดับสถานะ Alarm และ Technician แก้ Alarm ที่ปิดแล้วไม่ได้ (BR-ALM-01, 02) | trigger `alarms_enforce_update_rules` (ฟังก์ชัน `enforce_alarm_update_rules`) |
| บันทึกผู้ปิดและเวลาที่ปิด ล้างเมื่อเปิดใหม่ (BR-ALM-04) | trigger `alarms_enforce_update_rules` (ฟังก์ชัน `enforce_alarm_update_rules`) |
| งานซ่อม Completed ต้องมี Action Taken และวันจบ (BR-MNT-02) | check `maintenance_records_completed_requires_details` |
| Alarm ที่อ้างต้องเป็นของเครื่องเดียวกับงานซ่อม (BR-MNT-03) | foreign key คู่ `maintenance_records_alarm_same_machine_fkey` |
| ผู้รับผิดชอบงานซ่อมต้องเป็น Admin หรือ Technician ไม่ใช่ Viewer (REQ-AUTH-08) | trigger `maintenance_records_enforce_assignee_role` (ฟังก์ชัน `enforce_maintenance_assignee_role`) ตรวจตอนสร้างงานและตอนเปลี่ยนผู้รับผิดชอบ |
| ห้ามเปลี่ยน Role ของตัวเอง (REQ-AUTH-07) | trigger `profiles_prevent_self_role_change` (ฟังก์ชัน `prevent_self_role_change`) |
| ใครอ่านและแก้อะไรได้ตาม Role | RLS policy ทุกตาราง (ดูตาราง "Role และสิทธิ์โดยสรุป" ด้านบน) |

ฟังก์ชันที่ใช้ร่วม: `current_user_role()` คืน Role ของผู้ใช้ที่ login ใช้ใน RLS policy
และ `admin_list_users()` คืนรายชื่อผู้ใช้พร้อมอีเมลให้เฉพาะ Admin (หน้า Users)

## วิธีติดตั้งและใช้งาน

### สิ่งที่ต้องมี

- Node.js 22 ขึ้นไป (CI ใช้ Node 22) และ npm
- Supabase project (ต้องมี Project URL และ publishable key)

### ขั้นตอน

```bash
git clone https://github.com/pattarakorn-sa-design/Automation-Web-App.git
cd Automation-Web-App
npm ci
```

1. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจริง

   | ตัวแปร | ความหมาย |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL อยู่ที่หน้า Project Overview ใน Supabase Dashboard |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key อยู่ที่ Project Settings > API Keys (ปลอดภัยที่จะอยู่ในเบราว์เซอร์ เพราะสิทธิ์ถูกจำกัดด้วย RLS) |
   | `SUPABASE_SECRET_KEY` | ใช้ฝั่ง Server เท่านั้น ข้าม RLS ได้ **ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_` และห้าม commit** |

   `.env.local` ถูกกันไว้ใน `.gitignore` อยู่แล้ว

2. ตั้งค่า Database ใน Supabase (ทำครั้งเดียวต่อ project)

   - **รัน migration:** Supabase Dashboard > SQL Editor เปิดไฟล์ใน `supabase/migrations/` ทีละไฟล์
     **ตามลำดับชื่อไฟล์** (17 ไฟล์ ตั้งแต่ `20260929031200_...` ถึง `20261001090100_...`) วางเนื้อหาแล้วกด Run
     ให้ครบทุกไฟล์ ห้ามแก้ไฟล์ที่รันไปแล้ว ถ้าต้องเปลี่ยน schema ให้เพิ่มไฟล์ migration ใหม่
   - **ปิดการสมัครเอง:** Authentication > Sign In / Providers ปิด "Allow new users to sign up"
     ระบบไม่มีหน้าสมัคร บัญชีสร้างโดยเจ้าของ project เท่านั้น
   - **สร้างผู้ใช้:** Authentication > Users > Add user ใส่ Email และรหัสผ่าน
     (ถ้ามีตัวเลือก Auto Confirm User ให้เปิด เพื่อให้ Login ได้ทันที) ระบบสร้างโปรไฟล์ให้อัตโนมัติ
     โดยเริ่มต้นเป็น `technician` (Admin ตั้งเป็น `viewer` ได้ที่หน้า Users)
   - **ตั้ง Admin คนแรก:** Table Editor > `profiles` แก้ `role` ของผู้ใช้นั้นเป็น `admin`
     หลังจากนั้น Admin เปลี่ยน Role ของคนอื่นได้ที่หน้า Users
   - **ข้อมูลตัวอย่าง (ไม่บังคับ):** SQL Editor รัน `supabase/seed.sql` ต้องมีผู้ใช้อย่างน้อย 1 คนก่อน
     ได้เครื่องจักร 10 เครื่อง, Alarm 9 รายการ และงานซ่อม 8 รายการ รันซ้ำได้โดยไม่ซ้ำข้อมูล

   ไฟล์ `types/database.ts` มีอยู่ใน repo แล้ว ไม่ต้องสร้างเอง (สร้างใหม่ด้วย `npm run db:types`
   ได้เฉพาะผู้มีสิทธิ์ใน Supabase project ที่ผูกไว้ ดูรายละเอียดใน [docs/NOTES.md](docs/NOTES.md))

3. รันเซิร์ฟเวอร์สำหรับพัฒนา

   ```bash
   npm run dev
   ```

   เปิด <http://localhost:3000>

### คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันเซิร์ฟเวอร์สำหรับพัฒนา |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
| `npx tsc --noEmit` | ตรวจ type ของ TypeScript |
| `npm run build` | build สำหรับ production |
| `npm test` | รัน unit test (Vitest) |

รัน `npm run lint`, `npx tsc --noEmit` และ `npm run build` ให้ผ่านก่อน commit ทุกครั้ง
GitHub Actions จะรัน install, lint, build และ test ให้อัตโนมัติเมื่อ push และเมื่อเปิด Pull Request

### โครงสร้างโปรเจ็ค

```
app/                 routes, layouts, pages
components/          UI ที่ใช้ซ้ำ (StatusBadge, EmptyState, ErrorState, ConfirmDialog, ...)
features/<domain>/   โค้ดของแต่ละส่วนงาน: auth, machines, alarms, maintenance, dashboard
lib/supabase/        Supabase client ฝั่ง browser และ server
types/               TypeScript types
supabase/            migration และ seed
docs/                เอกสารความต้องการและโน้ตของทีม
```

## Vercel URL

<https://automation-web-app.vercel.app>

## การใช้ AI

ทั้งสองคนใช้ AI coding assistant (Claude Code) ช่วยพัฒนา โดยมีกฎการใช้อยู่ใน `AGENTS.md`

- **ใช้ทำอะไร:** ตั้ง CI และ test, สร้าง component และตกแต่งหน้าจอ, เขียนเอกสาร (ฝั่ง Phakkathima) และ
  Database schema, RLS, Auth และ Server Action (ฝั่ง Pattarakorn)
- **ตรวจผลอย่างไร:** รัน lint, tsc, build และ test ก่อน commit ทุกครั้ง, GitHub Actions บนทุก Pull Request,
  อีกคนในทีมรีวิวและเป็นคน merge และทดสอบสิทธิ์ของทุก Role กับ Database
- **ปัญหาที่พบ:** เช่น บั๊กของ ConfirmDialog ที่เจอตอนรีวิว ทั้งที่การตรวจอัตโนมัติผ่านหมด

รายละเอียดทั้งหมด พร้อมตารางว่า AI ทำอะไรและคนตัดสินใจอะไร อยู่ใน [รายงานการใช้ AI](docs/AI_REPORT.md)
