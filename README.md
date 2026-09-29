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
