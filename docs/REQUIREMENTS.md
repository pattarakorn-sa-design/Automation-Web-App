# Requirement Specification
## Alarm & Maintenance Management System

| รายการ | รายละเอียด |
|---|---|
| เวอร์ชันเอกสาร | 0.1 (Draft) |
| สถานะ | รอยืนยัน Open Questions (หัวข้อ 12) |
| อ้างอิง | ใบงาน *Automation Web Application ด้วย AI*, บทที่ 1–3 |

---

## 1. Problem Statement

โรงงานบันทึก Alarm และงานซ่อมบำรุงเครื่องจักรกระจายอยู่หลายแหล่ง (กระดาษ, Excel, แชท) ทำให้ค้นหาประวัติได้ยาก ติดตามสถานะงานซ่อมไม่ชัด และผู้เกี่ยวข้องเห็นข้อมูลไม่ตรงกัน จึงต้องการ Web Application กลางสำหรับจัดการข้อมูลเครื่องจักร บันทึก Alarm บันทึกงานซ่อมบำรุง และสรุปภาพรวมบน Dashboard โดยจำกัดสิทธิ์ตามบทบาทของผู้ใช้

**Business Goal**
- BG-01 ลดเวลาค้นหาประวัติ Alarm และงานซ่อมของเครื่องจักรแต่ละเครื่อง
- BG-02 ให้ทุกคนเห็นสถานะเครื่องจักรและงานค้างจากแหล่งข้อมูลเดียวกัน
- BG-03 ระบุได้ว่าใครเปลี่ยนแปลงข้อมูลสำคัญ (ปิด Alarm, บันทึกงานซ่อม) เมื่อไร

---

## 2. Stakeholders และ Users

| Stakeholder | ความต้องการ | ใช้ระบบโดยตรง |
|---|---|---|
| System Admin / Maintenance Engineer | จัดการ Machine Master, User/Role, ดูแลข้อมูล Alarm และ Maintenance ทั้งหมด | ใช่ (Role: Admin) |
| Technician | ดูข้อมูลเครื่อง, อัปเดตสถานะ Alarm, บันทึกผลการซ่อม | ใช่ (Role: Technician) |
| Production Manager | ดูภาพรวมสถานะเครื่องและ Alarm ที่กระทบการผลิต | ใช่ (Role: Viewer – Bonus) |
| อาจารย์ผู้ประเมิน | ตรวจว่าระบบครบตาม Requirement, Deploy ได้จริง, ปลอดภัยพื้นฐาน | ใช่ (ผ่านบัญชีทดสอบ) |

---

## 3. Roles และ Permission Matrix

| ความสามารถ | Admin | Technician | Viewer *(Bonus)* |
|---|:-:|:-:|:-:|
| Login / Logout | ✅ | ✅ | ✅ |
| ดู Dashboard | ✅ | ✅ | ✅ |
| ดู Machine | ✅ | ✅ | ✅ |
| เพิ่ม / แก้ไข / ลบ Machine | ✅ | ❌ | ❌ |
| ดู Alarm | ✅ | ✅ | ✅ |
| สร้าง Alarm | ✅ | ❌ *(ดู OQ-01)* | ❌ |
| แก้ไขรายละเอียด Alarm (code, description, เวลา) | ✅ | ❌ | ❌ |
| เปลี่ยนสถานะ Alarm / ใส่ Cause, Action Taken | ✅ | ✅ | ❌ |
| ดู Maintenance | ✅ | ✅ | ✅ |
| สร้าง Maintenance Record | ✅ | ✅ | ❌ |
| แก้ไข Maintenance Record | ✅ ทุกรายการ | ✅ เฉพาะที่ตนเป็นผู้รับผิดชอบ *(ดู OQ-02)* | ❌ |
| จัดการ User / กำหนด Role ของผู้อื่น | ✅ | ❌ | ❌ |
| แก้ชื่อที่แสดงของตนเอง *(ดู REQ-AUTH-09)* | ✅ | ✅ | ✅ |
| เปลี่ยน Role ของตนเอง | ❌ | ❌ | ❌ |

> สิทธิ์ทุกข้อต้องบังคับที่ **Server และ Database (RLS)** — การซ่อนปุ่มหรือเมนูใน UI เป็นเพียง UX ไม่ใช่ Authorization

---

## 4. Scope

### 4.1 In Scope (Version 1)
- Authentication ด้วย Supabase Auth (Email + Password) และ Role-based Access
- Machine Master (CRUD)
- Alarm Record (Create / Read / Update + เปลี่ยนสถานะ)
- Maintenance Record (Create / Read / Update)
- Search และ Filter ในทุกหน้ารายการ
- Dashboard สรุปจำนวน
- Input Validation ทั้งฝั่ง Client และ Server/Database
- CI ด้วย GitHub Actions, Deploy บน Vercel, README

### 4.2 Out of Scope (Version 1)
- เชื่อมต่อ PLC / SCADA / IoT Gateway จริง (ออกแบบให้รองรับในอนาคตเท่านั้น)
- แจ้งเตือนผ่าน SMS / LINE / Email
- Predictive Maintenance ด้วย AI
- Mobile Native App
- เชื่อมต่อ ERP / MES
- สมัครสมาชิกด้วยตนเอง (Self Sign-up) — บัญชีสร้างโดย Admin เท่านั้น

### 4.3 MoSCoW Prioritization

| ระดับ | รายการ |
|---|---|
| **Must have** | Login/Logout, Role Admin/Technician, Machine CRUD, Alarm CRU + Status, Maintenance CRU, Search/Filter ≥ 2 เงื่อนไข, Dashboard, Validation, RLS, CI, Vercel, README |
| **Should have** | Filter ตามช่วงวันที่, หน้า Machine History, บันทึก `closed_by` / `closed_at`, Responsive UI |
| **Could have** *(Bonus)* | Role Viewer, สถานะ Waiting Part, กราฟ Alarm, Export CSV, Audit Log, Dark Mode |
| **Won't have now** | เชื่อม PLC จริง, Notification ภายนอก, Predictive Maintenance |

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization (AUTH)

| ID | Requirement | Priority |
|---|---|---|
| REQ-AUTH-01 | ผู้ใช้ต้อง Login ด้วย Email และ Password ของบัญชีที่ Admin สร้างไว้ผ่าน Supabase Auth | Must |
| REQ-AUTH-02 | ผู้ใช้ต้อง Logout ได้จากทุกหน้า และหลัง Logout ต้องเข้าหน้าที่ต้อง Login ไม่ได้ | Must |
| REQ-AUTH-03 | ผู้ใช้ที่ยังไม่ Login ที่เปิดหน้าใดก็ตามในระบบ ต้องถูก Redirect ไปหน้า Login | Must |
| REQ-AUTH-04 | ผู้ใช้ทุกคนต้องมี Role เดียว (`admin` หรือ `technician`) เก็บในตาราง `profiles` | Must |
| REQ-AUTH-05 | ผู้ใช้ที่ไม่ใช่ Admin ที่เปิด URL ของหน้า Admin (เช่น `/users`, `/machines/new`) ต้องถูกปฏิเสธหรือ Redirect | Must |
| REQ-AUTH-06 | การเขียนข้อมูลทุกประเภทต้องถูกตรวจสิทธิ์ที่ Server Action และ RLS Policy ตาม Permission Matrix หัวข้อ 3 | Must |
| REQ-AUTH-07 | Admin ต้องดูรายชื่อผู้ใช้และเปลี่ยน Role ของผู้ใช้อื่นได้ แต่เปลี่ยน Role ของตนเองไม่ได้ (ป้องกันระบบไม่มี Admin เหลือ) | Must |
| REQ-AUTH-08 | รองรับ Role `viewer` แบบอ่านอย่างเดียว | Could |
| REQ-AUTH-09 | ผู้ใช้ทุกคนแก้ชื่อที่แสดง (`full_name`) ของตนเองได้ เพื่อแก้ชื่อที่สะกดผิดโดยไม่ต้องพึ่ง Admin คนอื่น แต่เปลี่ยน Role ของตนเองไม่ได้ | Should |

### 5.2 Machine Master (MCH)

| ID | Requirement | Priority |
|---|---|---|
| REQ-MCH-01 | Admin ต้องเพิ่ม, ดู, แก้ไข และลบ Machine ได้ | Must |
| REQ-MCH-02 | Machine ต้องมีข้อมูล: Machine ID, Machine Name, Machine Type, Location, Status | Must |
| REQ-MCH-03 | Machine ID ต้องไม่ซ้ำกันในระบบ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) | Must |
| REQ-MCH-04 | Status ต้องเป็นหนึ่งใน `Running`, `Stop`, `Alarm`, `Maintenance` เท่านั้น | Must |
| REQ-MCH-05 | ผู้ใช้ทุก Role ต้องดูรายการ Machine และรายละเอียดได้ | Must |
| REQ-MCH-06 | ลบ Machine ที่มี Alarm หรือ Maintenance ผูกอยู่ไม่ได้ ระบบต้องแจ้งเหตุผล | Must |
| REQ-MCH-07 | ก่อนลบ Machine ระบบต้องให้ยืนยัน | Must |
| REQ-MCH-08 | หน้า Machine History แสดง Alarm และ Maintenance ทั้งหมดของเครื่องนั้นเรียงตามเวลา | Should |

### 5.3 Alarm Record (ALM)

| ID | Requirement | Priority |
|---|---|---|
| REQ-ALM-01 | Admin ต้องสร้าง Alarm โดยระบุ Machine, Alarm Code, Alarm Description, Date/Time ที่เกิด | Must |
| REQ-ALM-02 | Alarm ต้องมีฟิลด์ Cause และ Status; Status เริ่มต้นเป็น `Open` | Must |
| REQ-ALM-03 | Status ต้องเป็นหนึ่งใน `Open`, `In Progress`, `Closed` | Must |
| REQ-ALM-04 | Admin และ Technician ต้องเปลี่ยนสถานะ Alarm ได้ตาม Business Rule BR-ALM | Must |
| REQ-ALM-05 | Admin ต้องแก้ไขรายละเอียด Alarm (code, description, เวลา, machine) ได้ | Must |
| REQ-ALM-06 | ผู้ใช้ทุก Role ต้องดูรายการและรายละเอียด Alarm ได้ | Must |
| REQ-ALM-07 | เมื่อปิด Alarm ระบบต้องบันทึก `closed_by` และ `closed_at` อัตโนมัติ | Should |
| REQ-ALM-08 | ระบบไม่มีการลบ Alarm (เพื่อเก็บประวัติ) | Must |

### 5.4 Maintenance Record (MNT)

| ID | Requirement | Priority |
|---|---|---|
| REQ-MNT-01 | Admin และ Technician ต้องสร้าง Maintenance Record ได้ | Must |
| REQ-MNT-02 | Maintenance Record ต้องมี: Machine, Technician ผู้รับผิดชอบ, ประเภท (`Corrective` / `Preventive`), Problem, Action Taken, Start Date, End Date, Status | Must |
| REQ-MNT-03 | อ้างอิง Alarm ที่เป็นต้นเหตุได้ (ไม่บังคับ) และ Alarm นั้นต้องเป็นของ Machine เดียวกัน | Should |
| REQ-MNT-04 | Status ต้องเป็นหนึ่งใน `Pending`, `In Progress`, `Completed` | Must |
| REQ-MNT-05 | แก้ไข Maintenance Record ได้ตาม Permission Matrix | Must |
| REQ-MNT-06 | ผู้ใช้ทุก Role ต้องดูรายการและรายละเอียด Maintenance ได้ | Must |
| REQ-MNT-07 | เพิ่มสถานะ `Waiting Part` | Could |

### 5.5 Search & Filter (SRC)

| ID | Requirement | Priority |
|---|---|---|
| REQ-SRC-01 | หน้า Machine: ค้นหาด้วย Machine ID หรือ Name (ข้อความบางส่วน) และกรองด้วย Status, Type | Must |
| REQ-SRC-02 | หน้า Alarm: กรองด้วย Machine, Status, Alarm Code | Must |
| REQ-SRC-03 | หน้า Maintenance: กรองด้วย Machine, Status, Technician | Must |
| REQ-SRC-04 | ใช้หลายเงื่อนไขพร้อมกันได้ (AND) และล้าง Filter ได้ในคลิกเดียว | Must |
| REQ-SRC-05 | ค่า Filter เก็บใน URL Query String เพื่อ Refresh หรือแชร์ลิงก์แล้วได้ผลเดิม | Should |
| REQ-SRC-06 | กรอง Alarm และ Maintenance ตามช่วงวันที่ | Should |
| REQ-SRC-07 | เมื่อไม่พบข้อมูล ต้องแสดงข้อความ "ไม่พบข้อมูล" แทนตารางว่าง | Must |

### 5.6 Dashboard (DSH)

| ID | Requirement | Priority |
|---|---|---|
| REQ-DSH-01 | แสดงจำนวนเครื่องจักรทั้งหมด | Must |
| REQ-DSH-02 | แสดงจำนวนเครื่องแยกตาม Status: Running, Stop, Alarm, Maintenance | Must |
| REQ-DSH-03 | แสดงจำนวน Alarm ที่ยังไม่ปิด (Open + In Progress) และจำนวนทั้งหมด | Must |
| REQ-DSH-04 | แสดงจำนวนงาน Maintenance ที่ยังไม่เสร็จ และจำนวนทั้งหมด | Must |
| REQ-DSH-05 | แสดง Alarm ล่าสุด 5 รายการ พร้อมลิงก์ไปยังรายละเอียด | Should |
| REQ-DSH-06 | กราฟจำนวน Alarm ต่อวันย้อนหลัง 7 วัน หรือแยกตามเครื่อง | Could |

### 5.7 Input Validation (VAL)

| ID | Requirement | Priority |
|---|---|---|
| REQ-VAL-01 | ฟิลด์บังคับห้ามว่างหรือเป็นช่องว่างล้วน (ตัด whitespace หัวท้ายก่อนตรวจ) | Must |
| REQ-VAL-02 | Validation ต้องทำซ้ำฝั่ง Server ด้วย Schema เดียวกับฝั่ง Client และมี Constraint ใน Database | Must |
| REQ-VAL-03 | ข้อความ Error ต้องแสดงใต้ฟิลด์ที่ผิด และระบุว่าต้องแก้อะไร | Must |
| REQ-VAL-04 | ปุ่ม Submit ต้อง Disable ระหว่างส่งข้อมูล เพื่อกันการบันทึกซ้ำ | Must |
| REQ-VAL-05 | เมื่อบันทึกสำเร็จหรือล้มเหลว ต้องแสดงผลให้ผู้ใช้เห็นชัด | Must |

**กฎ Validation ของแต่ละฟิลด์**

| ฟิลด์ | กฎ |
|---|---|
| Machine ID | บังคับ, รูปแบบ `^[A-Z]{1,4}-\d{3,5}$` (เช่น `M-001`, `CNC-0012`), ไม่ซ้ำ, แปลงเป็นตัวพิมพ์ใหญ่ก่อนบันทึก |
| Machine Name | บังคับ, 1–100 ตัวอักษร |
| Machine Type | บังคับ, 1–50 ตัวอักษร |
| Location | บังคับ, 1–100 ตัวอักษร |
| Alarm Code | บังคับ, รูปแบบ `^[A-Z0-9-]{2,20}$` (เช่น `E-101`) |
| Alarm Description | บังคับ, 1–500 ตัวอักษร |
| Occurred At | บังคับ, ห้ามเป็นเวลาในอนาคต |
| Cause | ไม่บังคับตอนสร้าง, ≤ 500 ตัวอักษร, บังคับเมื่อปิด Alarm |
| Action Taken (Alarm) | บังคับเมื่อปิด Alarm, ≤ 1000 ตัวอักษร |
| Problem / Action Taken (Maintenance) | Problem บังคับ; Action Taken บังคับเมื่อ Status = Completed; ≤ 1000 ตัวอักษร |
| Start / End Date | Start บังคับ; End บังคับเมื่อ Completed และต้องไม่ก่อน Start |

---

## 6. Business Rules

| ID | Rule |
|---|---|
| BR-ALM-01 | ลำดับสถานะที่อนุญาต: `Open → In Progress`, `Open → Closed`, `In Progress → Closed`, `In Progress → Open` |
| BR-ALM-02 | Alarm ที่ `Closed` แล้วเปลี่ยนสถานะไม่ได้ ยกเว้น Admin เปิดใหม่ (Reopen) |
| BR-ALM-03 | ปิด Alarm ได้เมื่อมี Cause และ Action Taken ครบ |
| BR-ALM-04 | เมื่อปิด Alarm ระบบบันทึก `closed_by` = ผู้ใช้ปัจจุบัน และ `closed_at` = เวลาปัจจุบัน; เมื่อ Reopen ให้ล้างค่าทั้งสอง |
| BR-MNT-01 | Technician แก้ไขได้เฉพาะ Maintenance Record ที่ตนเป็น Technician ผู้รับผิดชอบ |
| BR-MNT-02 | ตั้ง Status เป็น `Completed` ได้เมื่อมี Action Taken และ End Date |
| BR-MNT-03 | Alarm ที่อ้างอิงต้องเป็นของ Machine เดียวกับ Maintenance Record |
| BR-MCH-01 | Status ของ Machine เปลี่ยนโดย Admin ผ่านหน้าแก้ไขเท่านั้นใน Version 1 (ในอนาคตจะมาจาก PLC Gateway — ดู OQ-03) |
| BR-MCH-02 | ลบ Machine ได้เมื่อไม่มี Alarm และ Maintenance อ้างอิง (บังคับด้วย Foreign Key `ON DELETE RESTRICT`) |

---

## 7. Non-functional Requirements

| ID | ด้าน | Requirement |
|---|---|---|
| NFR-SEC-01 | Security | Supabase Service Role Key และ Secret อื่นเก็บใน Environment Variable ฝั่ง Server เท่านั้น ห้ามอยู่ในโค้ดฝั่ง Client หรือ Commit ลง GitHub |
| NFR-SEC-02 | Security | เปิด RLS ทุกตาราง Policy ตรงกับ Permission Matrix หัวข้อ 3 |
| NFR-SEC-03 | Security | มี `.env.example` ใน Repo โดยมีเฉพาะชื่อตัวแปร ไม่มีค่าจริง และ `.env*.local` อยู่ใน `.gitignore` |
| NFR-PERF-01 | Performance | Dashboard แสดงข้อมูลหลักภายใน 3 วินาทีบน Vercel เมื่อมี Machine ≤ 200 และ Alarm/Maintenance ≤ 5,000 รายการ |
| NFR-PERF-02 | Performance | หน้ารายการแบ่งหน้า (Pagination) ครั้งละไม่เกิน 20–50 รายการ; ใช้ Count/Aggregate ที่ Database ไม่ดึงข้อมูลทั้งหมดมานับ |
| NFR-REL-01 | Reliability | เมื่อ Database หรือ API ล้มเหลว ต้องแสดง Error State ที่อ่านเข้าใจได้ แทนหน้าว่าง และห้ามแสดงว่าบันทึกสำเร็จ |
| NFR-USE-01 | Usability | ใช้งานได้บนหน้าจอกว้าง 360 px ขึ้นไป (Responsive) |
| NFR-USE-02 | Usability | Status แสดงเป็น Badge สีที่สื่อความหมาย (เช่น Running = เขียว, Alarm = แดง) พร้อมข้อความ ไม่ใช้สีอย่างเดียว |
| NFR-MNT-01 | Maintainability | โค้ดแบ่งตาม Feature (machines / alarms / maintenance / auth / dashboard) ผ่าน Lint และ Type Check |
| NFR-DEV-01 | Dev Process | ประวัติ Commit ทยอยทำระหว่างพัฒนา ไม่อัปโหลดทั้งโปรเจ็คครั้งเดียว |

---

## 8. Constraints

| ID | Constraint |
|---|---|
| CON-01 | Frontend/Backend: Next.js (App Router) + Tailwind CSS |
| CON-02 | Database และ Auth: Supabase |
| CON-03 | Source Code บน GitHub: `pattarakorn-sa-design/Automation-Web-App` |
| CON-04 | CI ด้วย GitHub Actions: Install → Lint → Build (→ Test) ทำงานอัตโนมัติเมื่อ Push และ Pull Request แสดงผล Passed/Failed |
| CON-05 | Deploy บน Vercel และ URL ต้องเปิดใช้งานได้จริง |
| CON-06 | README ต้องมี: ชื่อและวัตถุประสงค์, Function หลักและ Technology, Database Structure, วิธีติดตั้ง/ใช้งาน, Vercel URL, รายละเอียดการใช้ AI |

---

## 9. Data Requirements

| ตาราง | ฟิลด์หลัก | ความสัมพันธ์ |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `full_name`, `role`, `created_at` | 1:1 กับ `auth.users` |
| `machines` | `id`, `machine_code` (unique), `name`, `type`, `location`, `status`, `created_at`, `updated_at` | 1:N กับ `alarms`, `maintenance_records` |
| `alarms` | `id`, `machine_id`, `alarm_code`, `description`, `occurred_at`, `cause`, `action_taken`, `status`, `created_by`, `closed_by`, `closed_at`, `created_at`, `updated_at` | N:1 `machines`; `created_by`/`closed_by` → `profiles` |
| `maintenance_records` | `id`, `machine_id`, `alarm_id` (nullable), `technician_id`, `type`, `problem`, `action_taken`, `status`, `start_date`, `end_date`, `created_by`, `created_at`, `updated_at` | N:1 `machines`, `alarms`, `profiles` |
| `audit_logs` *(Could)* | `id`, `actor_id`, `action`, `entity`, `entity_id`, `changes`, `created_at` | N:1 `profiles` |

Status และ Role ใช้ Postgres `enum` หรือ `CHECK` constraint เพื่อไม่ให้เก็บค่าอื่นได้

---

## 10. Pages / Functions

| Route | ผู้เข้าถึง | Function หลัก |
|---|---|---|
| `/login` | ทุกคน | Sign in |
| `/` (Dashboard) | ทุก Role | Summary Cards, Alarm ล่าสุด |
| `/machines` | ทุก Role | List, Search, Filter |
| `/machines/new`, `/machines/[id]/edit` | Admin | Create / Update / Delete |
| `/machines/[id]` | ทุก Role | รายละเอียด + History *(Should)* |
| `/alarms` | ทุก Role | List, Filter |
| `/alarms/new` | Admin | Create |
| `/alarms/[id]` | ทุก Role | รายละเอียด; เปลี่ยนสถานะ (Admin, Technician); แก้ไข (Admin) |
| `/maintenance` | ทุก Role | List, Filter |
| `/maintenance/new` | Admin, Technician | Create |
| `/maintenance/[id]` | ทุก Role | รายละเอียด; แก้ไขตามสิทธิ์ |
| `/users` | Admin | User List, เปลี่ยน Role |

---

## 11. User Stories และ Acceptance Criteria

**US-01 — Login**
*As a user, I want to log in with my account, so that I can access features allowed for my role.*
- Given บัญชีที่ถูกต้อง, When Login, Then เข้า Dashboard และเห็นเมนูตาม Role
- Given รหัสผ่านผิด, When Login, Then อยู่หน้าเดิมและแสดง "Email หรือรหัสผ่านไม่ถูกต้อง"
- Given ยังไม่ Login, When เปิด `/machines`, Then ถูก Redirect ไป `/login`

**US-02 — Admin เพิ่ม Machine** (REQ-MCH-01, REQ-MCH-03)
*As an Admin, I want to add a machine, so that alarms and maintenance can be recorded against it.*
- Given ไม่มี `M-001`, When Admin บันทึก Machine ID `M-001` พร้อมข้อมูลครบ, Then บันทึกสำเร็จและเห็นในรายการ
- Given มี `M-001` อยู่แล้ว, When Admin บันทึก `m-001`, Then ระบบไม่บันทึกและแสดง "Machine ID นี้มีอยู่แล้ว"
- Given ช่อง Machine Name ว่าง, When กดบันทึก, Then แสดง Error ใต้ช่องนั้นและไม่ส่งข้อมูล

**US-03 — ป้องกันสิทธิ์ Technician** (REQ-AUTH-05, REQ-AUTH-06)
*As the system owner, I want technicians blocked from admin operations, so that master data stays correct.*
- Given Login เป็น Technician, When เปิด `/machines/new` หรือ `/users` โดยตรง, Then ถูกปฏิเสธหรือ Redirect
- Given Login เป็น Technician, When เรียก insert ตาราง `machines` ผ่าน Supabase Client โดยตรง, Then RLS ปฏิเสธ

**US-04 — Technician ปิด Alarm** (REQ-ALM-04, BR-ALM-03, BR-ALM-04)
*As a Technician, I want to update an alarm's status, so that the team knows whether the problem is still active.*
- Given Alarm สถานะ `Open`, When Technician เปลี่ยนเป็น `In Progress`, Then บันทึกสำเร็จและ `updated_at` เปลี่ยน
- Given Alarm ยังไม่มี Cause, When เปลี่ยนเป็น `Closed`, Then ระบบไม่บันทึกและแจ้งให้กรอก Cause และ Action Taken
- Given กรอกครบ, When เปลี่ยนเป็น `Closed`, Then บันทึก `closed_by` และ `closed_at` และ Alarm ไม่ถูกนับเป็นค้างใน Dashboard
- Given Alarm `Closed`, When Technician พยายามเปลี่ยนสถานะ, Then ถูกปฏิเสธ

**US-05 — Technician บันทึกงานซ่อม** (REQ-MNT-01, BR-MNT-01, BR-MNT-02)
*As a Technician, I want to record the problem and action taken, so that the machine's repair history is kept.*
- Given ข้อมูลครบ, When บันทึก Maintenance, Then เห็นรายการใหม่ในหน้า Maintenance และใน History ของเครื่อง
- Given ตั้ง Status เป็น `Completed` แต่ไม่มี Action Taken, When บันทึก, Then แสดง Error
- Given End Date ก่อน Start Date, When บันทึก, Then แสดง Error
- Given รายการของ Technician คนอื่น, When Technician พยายามแก้ไข, Then ถูกปฏิเสธ

**US-06 — ค้นหาและกรอง** (REQ-SRC-01 ถึง 04)
*As a user, I want to filter alarms by machine and status, so that I can find the relevant records quickly.*
- Given มี Alarm ของหลายเครื่อง, When เลือก Machine = `M-001` และ Status = `Open`, Then แสดงเฉพาะ Alarm ที่ตรงทั้งสองเงื่อนไข
- Given ไม่มีรายการที่ตรง, When กรอง, Then แสดง "ไม่พบข้อมูล"

**US-07 — Dashboard** (REQ-DSH-01 ถึง 04)
*As a user, I want a summary dashboard, so that I can see overall machine and work status at a glance.*
- Given มี Machine 10 เครื่อง (Running 6, Stop 2, Alarm 1, Maintenance 1), When เปิด Dashboard, Then ตัวเลขตรงกับข้อมูลทุกช่อง
- Given Database ใช้งานไม่ได้, When เปิด Dashboard, Then แสดง Error State ไม่ใช่หน้าว่าง

---

## 12. Assumptions และ Open Questions

### Assumptions
- A-01 ระบบใช้ภายในโรงงาน จำนวนผู้ใช้ไม่เกิน 50 คน
- A-02 บัญชีผู้ใช้สร้างโดย Admin (ผ่าน Supabase Dashboard หรือหน้า Users) ผู้ใช้ใหม่มี Role เริ่มต้นเป็น `technician`
- A-03 เวลาแสดงผลเป็นเขตเวลา Asia/Bangkok และเก็บใน Database เป็น `timestamptz`
- A-04 Version 1 ไม่มีข้อมูลจาก PLC จริง Machine Status ถูกกำหนดด้วยมือ

### Open Questions (ต้องยืนยันก่อนเริ่มพัฒนา)
| ID | คำถาม | ค่าที่ใช้ถ้าไม่มีคำตอบ |
|---|---|---|
| OQ-01 | Technician สร้าง Alarm ใหม่ได้หรือไม่ (ใบงานระบุแค่ "เปลี่ยนสถานะ Alarm") | ไม่ได้ — Admin สร้างเท่านั้น |
| OQ-02 | Technician แก้ไข Maintenance ของคนอื่นได้หรือไม่ | ไม่ได้ — แก้ได้เฉพาะของตน |
| OQ-03 | เมื่อเปิด Alarm ควรเปลี่ยน Machine Status เป็น `Alarm` อัตโนมัติหรือไม่ | ไม่เปลี่ยนอัตโนมัติใน Version 1 |
| OQ-04 | UI ใช้ภาษาไทย อังกฤษ หรือสองภาษา | ภาษาอังกฤษ + ข้อความ Error ภาษาไทย |
| OQ-05 | ต้องการ Bonus ข้อใดบ้าง | Viewer, Waiting Part, Machine History, กราฟ Alarm, Filter ช่วงวันที่ |

---

## 13. Traceability (Requirement → Implementation → Test)

| Requirement | ตาราง / Policy | Page | Test Case |
|---|---|---|---|
| REQ-AUTH-03, 05 | — (Middleware) | ทุกหน้า | TC-AUTH-01, 02 |
| REQ-AUTH-06 | RLS ทุกตาราง | — | TC-AUTH-03 |
| REQ-MCH-03 | `machines.machine_code` UNIQUE | `/machines/new` | TC-MCH-02 |
| REQ-MCH-06 | FK `ON DELETE RESTRICT` | `/machines/[id]/edit` | TC-MCH-04 |
| REQ-ALM-04, BR-ALM-01–04 | `alarms.status`, Server Action ตรวจ transition | `/alarms/[id]` | TC-ALM-03, 04 |
| REQ-MNT-02, BR-MNT-02 | `maintenance_records` CHECK constraint | `/maintenance/new` | TC-MNT-02 |
| REQ-SRC-01–04 | Query + Index | `/machines`, `/alarms`, `/maintenance` | TC-SRC-01 |
| REQ-DSH-01–04 | Aggregate Query / View | `/` | TC-DSH-01 |
