# Alarm & Maintenance Management System

ระบบเว็บสำหรับโรงงานเพื่อบันทึกและติดตาม **เครื่องจักร (Machine)**, **Alarm** และ **งานซ่อมบำรุง (Maintenance)**
ในที่เดียว จำกัดสิทธิ์ตามบทบาทของผู้ใช้ และสรุปภาพรวมบน Dashboard

พัฒนาเป็นโปรเจ็คของนักศึกษา 2 คน รายละเอียดความต้องการทั้งหมดอยู่ที่ [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)

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
| Role-based Access | Admin และ Technician เข้าถึงหน้าและทำรายการได้ต่างกัน ตรวจสิทธิ์ทั้งที่ Server และ Database (RLS) |
| Machine Master | เพิ่ม / ดู / แก้ไข / ลบ เครื่องจักร (Admin) Machine ID ห้ามซ้ำ ลบเครื่องที่มี Alarm หรือ Maintenance ผูกอยู่ไม่ได้ |
| Alarm Record | สร้าง Alarm และเปลี่ยนสถานะ Open → In Progress → Closed ปิดได้เมื่อมี Cause และ Action Taken ครบ และบันทึกผู้ปิดกับเวลาที่ปิด |
| Maintenance Record | บันทึกปัญหาและการซ่อมของแต่ละเครื่อง สถานะ Pending / In Progress / Completed |
| Search / Filter | ค้นหาและกรองในหน้ารายการ ใช้หลายเงื่อนไขพร้อมกันได้ และเก็บค่าใน URL |
| Dashboard | สรุปจำนวนเครื่องแยกตามสถานะ, Alarm ที่ยังไม่ปิด, งานซ่อมที่ยังไม่เสร็จ และ Alarm ล่าสุด |
| User Management | Admin ดูรายชื่อผู้ใช้และเปลี่ยน Role |

### Role และสิทธิ์โดยสรุป

| ความสามารถ | Admin | Technician |
|---|:-:|:-:|
| ดู Dashboard, Machine, Alarm, Maintenance | ✅ | ✅ |
| เพิ่ม / แก้ไข / ลบ Machine | ✅ | ❌ |
| สร้าง / แก้ไขรายละเอียด Alarm | ✅ | ❌ |
| เปลี่ยนสถานะ Alarm | ✅ | ✅ |
| สร้าง Maintenance Record | ✅ | ✅ |
| แก้ไข Maintenance Record | ทุกรายการ | เฉพาะที่ตนรับผิดชอบ |
| จัดการ User และ Role | ✅ | ❌ |

ตารางเต็มและกฎทางธุรกิจอยู่ใน [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)

## Technology

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend / Backend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase (PostgreSQL, Supabase Auth, Row Level Security) ผ่าน `@supabase/supabase-js` และ `@supabase/ssr` |
| Testing | Vitest |
| CI | GitHub Actions (lint, build, test) |
| Hosting | Vercel |

## Database Structure

<!-- TODO(11.2): Pattarakorn เขียนร่างตารางและความสัมพันธ์จาก migration จริง แล้ว Phakkathima จัดหน้า -->
_(รอสรุปโครงสร้างตารางและความสัมพันธ์จาก schema จริงหลัง migration ถูก merge)_

ตารางที่ออกแบบไว้ตามความต้องการ ได้แก่ `profiles`, `machines`, `alarms` และ `maintenance_records`
รายละเอียดฟิลด์ตามแบบร่างอยู่ในหัวข้อ 9 ของ [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)

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
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL จาก Supabase Dashboard > Project Settings > API |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key (ปลอดภัยที่จะอยู่ในเบราว์เซอร์ เพราะสิทธิ์ถูกจำกัดด้วย RLS) |
   | `SUPABASE_SECRET_KEY` | ใช้ฝั่ง Server เท่านั้น ข้าม RLS ได้ **ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_` และห้าม commit** |

   `.env.local` ถูกกันไว้ใน `.gitignore` อยู่แล้ว

2. ตั้งค่า Database ด้วยไฟล์ใน `supabase/`
   <!-- TODO(11.1): เพิ่มขั้นตอนรัน migration และ seed.sql หลัง feat/db-schema และ chore/seed-data ถูก merge -->
   _(ขั้นตอนนี้จะเพิ่มเมื่อไฟล์ migration และ seed ถูก merge เข้า `main`)_

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

<!-- TODO(11.1): ใส่ URL จริงหลัง deploy บน Vercel (งาน 1.7 และ 8.x) -->
_(ใส่ URL หลัง deploy)_

## การใช้ AI

<!-- TODO(11.5): สรุปสั้นๆ หลังเขียนรายงานเสร็จ -->
รายละเอียดว่าใช้ AI ทำอะไร ส่วนไหน และตรวจสอบผลอย่างไร จะอยู่ในรายงานการใช้ AI
_(ลิงก์ไปยังรายงานจะเพิ่มเมื่อเขียนเสร็จ)_
