# Test Checklist

Checklist สำหรับทดสอบระบบก่อนส่งงาน (งาน 10.1 / 10.2) อ้างอิง Acceptance Criteria ในหัวข้อ 11
และ Traceability ในหัวข้อ 13 ของ `docs/REQUIREMENTS.md`

**ผลการทดสอบรอบ 10.2:** ทดสอบบน Vercel URL เมื่อ 2026-10-01 โดย Pattarakorn และ Phakkathima ด้วยบัญชี Admin, Technician และ Viewer ผ่านทุกข้อ ไม่พบบั๊ก ภายหลังพบบั๊กข้อความ 1 รายการระหว่างถ่าย Screenshot ดูตาราง "บั๊กที่พบ" ท้ายไฟล์

## วิธีใช้

- ทดสอบบน **Vercel URL** ด้วยบัญชี Admin, Technician และ Viewer สลับกัน
- ช่อง **A** = ผลเมื่อ Login เป็น Admin, ช่อง **T** = ผลเมื่อ Login เป็น Technician, ช่อง **V** = ผลเมื่อ Login เป็น Viewer
  - ใส่ `[x]` เมื่อผ่าน, `[ ]` เมื่อยังไม่ได้ทดสอบหรือไม่ผ่าน, `-` เมื่อ Role นั้นไม่เกี่ยวกับข้อนี้
- ถ้าไม่ผ่าน ให้จดไว้ในตาราง **บั๊กที่พบ** ท้ายไฟล์ แล้วแจ้งเจ้าของงาน (ระบบ = Pattarakorn, UI = Phakkathima)
- **ห้ามเขียน Email, รหัสผ่าน หรือ key จริงลงไฟล์นี้** บัญชีทดสอบให้ส่งกันทางแชทส่วนตัว
- ข้อมูลตัวอย่างมาจาก `supabase/seed.sql` (มี Machine 10 เครื่อง) ถ้ายังไม่ได้ seed ให้ข้ามข้อที่ต้องใช้ข้อมูลเดิม
- ข้อที่ต้องสร้างข้อมูลทดสอบเอง (ช่วงวันที่, Export) ดูวิธีเตรียมและเก็บกวาดใน Notes ข้อ 4 **ทดสอบหมวด 6 ข้อ TC-DSH-01 ก่อนสร้างข้อมูลทดสอบ** ไม่อย่างนั้นตัวเลขจะไม่ตรงกับ seed

## 1. Authentication และสิทธิ์

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-AUTH-01 | REQ-AUTH-01, US-01 | เปิด `/login` กรอก Email และรหัสผ่านที่ถูกต้อง | เข้า Dashboard และเห็นเมนูตาม Role | [x] | [x] | [x] |
| TC-AUTH-02 | US-01 | Login ด้วยรหัสผ่านผิด | อยู่หน้าเดิมและแสดง "Email หรือรหัสผ่านไม่ถูกต้อง" | [x] | [x] | [x] |
| TC-AUTH-03 | REQ-AUTH-03, US-01 | ยังไม่ Login แล้วเปิด `/`, `/machines`, `/alarms`, `/maintenance` ตรงๆ | ถูก Redirect ไป `/login` ทุกหน้า | [x] | - | - |
| TC-AUTH-04 | REQ-AUTH-02 | กด Logout จากหน้าใดก็ได้ แล้วกด Back ของเบราว์เซอร์ หรือเปิด `/machines` | กลับไป `/login` และเข้าหน้าที่ต้อง Login ไม่ได้ | [x] | [x] | [x] |
| TC-AUTH-05 | REQ-AUTH-05, US-03 | Login เป็น Technician แล้วเปิด `/users` ตรงๆ | ถูกปฏิเสธหรือ Redirect | - | [x] | - |
| TC-AUTH-06 | REQ-AUTH-05, US-03 | Login เป็น Technician แล้วเปิด `/machines/new` และ `/machines/[id]/edit` ตรงๆ | ถูกปฏิเสธหรือ Redirect | - | [x] | - |
| TC-AUTH-07 | REQ-AUTH-05 | Login เป็น Technician แล้วเปิด `/alarms/new` ตรงๆ | ถูกปฏิเสธหรือ Redirect | - | [x] | - |
| TC-AUTH-08 | REQ-AUTH-06, NFR-SEC-02, US-03 | Login เป็น Technician แล้วสั่ง insert / update / delete ตาราง `machines` ผ่าน Supabase Client โดยตรง (ไม่ผ่านหน้าเว็บ) | RLS ปฏิเสธทุกคำสั่ง ข้อมูลไม่เปลี่ยน | - | [x] | - |
| TC-AUTH-09 | REQ-AUTH-06 | Login เป็น Technician แล้วสั่ง insert ตาราง `alarms` ผ่าน Supabase Client โดยตรง | RLS ปฏิเสธ (Technician สร้าง Alarm ไม่ได้ ตาม OQ-01) | - | [x] | - |
| TC-AUTH-10 | REQ-AUTH-07 | Admin เปิด `/users` และลองเปลี่ยน Role ของตนเอง | ทำไม่ได้ และมีข้อความบอกเหตุผล | [x] | - | - |
| TC-AUTH-11 | REQ-AUTH-07 | Admin เปลี่ยน Role ของผู้ใช้อื่นจาก technician เป็น admin แล้วกลับ | เปลี่ยนสำเร็จ และสิทธิ์ของผู้ใช้นั้นเปลี่ยนตามเมื่อ Login ใหม่ | [x] | - | - |
| TC-AUTH-12 | UI, REQ-AUTH-08 | ดูเมนู Navbar หลัง Login | Admin เห็นเมนู Users, Technician และ Viewer ไม่เห็น ทุก Role มีปุ่ม Logout, ปุ่ม Theme และป้ายแสดง Role ของตนเอง (`admin` / `technician` / `viewer`) | [x] | [x] | [x] |
| TC-AUTH-13 | REQ-AUTH-09 | เปิด `/profile` แก้ชื่อที่แสดงเป็นชื่อใหม่แล้วบันทึก จากนั้นดูข้อความ Welcome ในหน้า Dashboard | บันทึกสำเร็จ ชื่อใหม่แสดงใน Dashboard ทุก Role และหน้านี้ไม่มีช่องให้เปลี่ยน Role | [x] | [x] | [x] |

## 2. Machine Master

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-MCH-01 | REQ-MCH-01, US-02 | เพิ่ม Machine ใหม่ (เช่น `M-101`) ด้วยข้อมูลครบ | บันทึกสำเร็จและเห็นในรายการ `/machines` | [x] | - | - |
| TC-MCH-02 | REQ-MCH-03, US-02 | เพิ่ม Machine ID ที่มีอยู่แล้ว (ทดสอบทั้ง `M-101` และ `m-101`) | ไม่บันทึก และแสดงข้อความ "Machine ID นี้มีอยู่แล้ว" | [x] | - | - |
| TC-MCH-03 | REQ-VAL-01, US-02 | เว้นช่อง Machine Name ว่าง หรือใส่แต่ช่องว่าง แล้วกดบันทึก | แสดง Error ใต้ช่องนั้นและไม่ส่งข้อมูล | [x] | - | - |
| TC-MCH-04 | REQ-MCH-06, BR-MCH-02 | ลบ Machine ที่มี Alarm หรือ Maintenance ผูกอยู่ | ลบไม่ได้ และแจ้งเหตุผลที่อ่านเข้าใจ | [x] | - | - |
| TC-MCH-05 | REQ-MCH-07 | ลบ Machine ที่ไม่มีข้อมูลผูกอยู่ | มีกล่องยืนยันก่อนลบ กดยกเลิกแล้วไม่ถูกลบ กดยืนยันแล้วถูกลบ | [x] | - | - |
| TC-MCH-06 | REQ-MCH-02 | ใส่ Machine ID ผิดรูปแบบ (เช่น `abc`, `M001`, `TOOLONG-1`) | แสดง Error ระบุรูปแบบที่ถูกต้อง เช่น `M-001` | [x] | - | - |
| TC-MCH-07 | REQ-MCH-02 | ใส่ Machine ID เป็นตัวพิมพ์เล็ก เช่น `tst-002` (ห้ามใช้ `cnc-002` เพราะซ้ำกับ seed) | ระบบแปลงเป็นตัวพิมพ์ใหญ่ `TST-002` ก่อนบันทึก จากนั้นลบเครื่องนี้ทิ้ง (ไม่มีข้อมูลผูกอยู่) | [x] | - | - |
| TC-MCH-08 | REQ-MCH-04 | เปลี่ยน Status ของ Machine ในหน้าแก้ไข | เลือกได้เฉพาะ Running, Stop, Alarm, Maintenance | [x] | - | - |
| TC-MCH-09 | REQ-MCH-05 | ดูรายการและรายละเอียด Machine | เห็นข้อมูลได้ทุก Role | [x] | [x] | [x] |
| TC-MCH-10 | REQ-VAL-04 | กดบันทึกฟอร์มแล้วสังเกตปุ่ม | ปุ่ม Submit ถูก Disable ระหว่างส่ง กดซ้ำไม่ได้ | [x] | - | - |
| TC-MCH-11 | NFR-USE-02 | ดู Status Badge | Running=เขียว, Stop=เทา, Alarm=แดง, Maintenance=เหลือง และมีข้อความกำกับ | [x] | [x] | [x] |

## 3. Alarm Record

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-ALM-01 | REQ-ALM-01, REQ-ALM-02 | สร้าง Alarm ใหม่ครบทุกช่อง | บันทึกสำเร็จ Status เริ่มต้นเป็น `Open` | [x] | - | - |
| TC-ALM-02 | REQ-VAL-03 | สร้าง Alarm โดยใส่ Occurred At เป็นเวลาในอนาคต หรือ Alarm Code ผิดรูปแบบ | แสดง Error ใต้ช่องที่ผิดและไม่บันทึก | [x] | - | - |
| TC-ALM-03 | REQ-ALM-04, US-04 | เปลี่ยน Alarm จาก `Open` เป็น `In Progress` | บันทึกสำเร็จ และ `updated_at` เปลี่ยน | [x] | [x] | - |
| TC-ALM-04 | BR-ALM-03, US-04 | เปลี่ยน Alarm ที่ยังไม่มี Cause เป็น `Closed` | ไม่บันทึก และแจ้งให้กรอก Cause และ Action Taken | [x] | [x] | - |
| TC-ALM-05 | BR-ALM-03, BR-ALM-04, US-04 | กรอก Cause และ Action Taken ครบแล้วปิด Alarm | ปิดสำเร็จ บันทึก `closed_by` และ `closed_at` และ Alarm ไม่ถูกนับเป็นค้างใน Dashboard | [x] | [x] | - |
| TC-ALM-06 | BR-ALM-02, US-04 | Technician พยายามเปลี่ยนสถานะ Alarm ที่ `Closed` แล้ว | ถูกปฏิเสธ | - | [x] | - |
| TC-ALM-07 | BR-ALM-02, BR-ALM-04 | Admin เปิด Alarm ที่ปิดแล้วกลับมา (Reopen) | ทำได้ และ `closed_by` / `closed_at` ถูกล้างค่า | [x] | - | - |
| TC-ALM-08 | BR-ALM-01 | Admin เปลี่ยน Alarm จาก `Closed` เป็น `In Progress` โดยตรง (ไม่ Reopen เป็น `Open` ก่อน) | ถูกปฏิเสธ สถานะยังเป็น `Closed` ต้อง Reopen เป็น `Open` ก่อน ตาม BR-ALM-01 (database บังคับด้วย trigger) | [x] | - | - |
| TC-ALM-09 | REQ-ALM-05 | Admin แก้ไข code, description, เวลา ของ Alarm | แก้ได้ | [x] | - | - |
| TC-ALM-10 | REQ-ALM-05 | Technician เปิดหน้า Alarm และดูว่ามีปุ่มหรือฟอร์มแก้ไขรายละเอียดหรือไม่ | ไม่มีให้แก้ (ถ้าเรียก Action ตรงๆ ต้องถูกปฏิเสธ) | - | [x] | - |
| TC-ALM-11 | REQ-ALM-08 | มองหาปุ่มหรือฟังก์ชันลบ Alarm | ไม่มีการลบ Alarm | [x] | [x] | [x] |
| TC-ALM-12 | REQ-ALM-06 | ดูรายการและรายละเอียด Alarm | เห็นข้อมูลได้ทุก Role | [x] | [x] | [x] |

## 4. Maintenance Record

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-MNT-01 | REQ-MNT-01, US-05 | สร้าง Maintenance Record ด้วยข้อมูลครบ | เห็นรายการใหม่ในหน้า Maintenance (และใน History ของเครื่องถ้ามี) | [x] | [x] | - |
| TC-MNT-02 | BR-MNT-02, US-05 | ตั้ง Status เป็น `Completed` โดยไม่มี Action Taken หรือ End Date | แสดง Error และไม่บันทึก | [x] | [x] | - |
| TC-MNT-03 | REQ-VAL-01, US-05 | ตั้ง End Date ก่อน Start Date | แสดง Error และไม่บันทึก | [x] | [x] | - |
| TC-MNT-04 | BR-MNT-01, US-05 | Technician พยายามแก้ Maintenance ของ Technician คนอื่น | ถูกปฏิเสธ (ทั้งหน้าเว็บและ RLS) | - | [x] | - |
| TC-MNT-05 | BR-MNT-01 | Technician แก้ Maintenance ของตนเอง | แก้ได้ | - | [x] | - |
| TC-MNT-06 | REQ-MNT-05 | Admin แก้ Maintenance ของทุกคน | แก้ได้ | [x] | - | - |
| TC-MNT-07 | REQ-MNT-03, BR-MNT-03 | เลือก Alarm ที่เป็นของ Machine คนละเครื่องกับที่เลือกไว้ | ถูกปฏิเสธ | [x] | [x] | - |
| TC-MNT-08 | REQ-MNT-04 | เปลี่ยน Status | เลือกได้เฉพาะ Pending, In Progress, Completed | [x] | [x] | - |
| TC-MNT-09 | REQ-MNT-06 | ดูรายการและรายละเอียด Maintenance | เห็นข้อมูลได้ทุก Role | [x] | [x] | [x] |

## 5. Search และ Filter

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-SRC-01 | REQ-SRC-02, US-06 | หน้า Alarm เลือก Machine = `INJ-002` และ Status = `Open` พร้อมกัน (ข้อมูล seed) | ได้ Alarm `E-101` รายการเดียว ส่วน `E-205` ของเครื่องเดียวกันที่ Closed ต้องไม่ขึ้น (พิสูจน์ว่ากรองทั้งสองเงื่อนไขพร้อมกัน) | [x] | [x] | [x] |
| TC-SRC-02 | REQ-SRC-07, US-06 | กรองด้วยเงื่อนไขที่ไม่มีข้อมูลตรง | แสดง "ไม่พบข้อมูล" ไม่ใช่ตารางว่าง | [x] | [x] | [x] |
| TC-SRC-03 | REQ-SRC-01 | หน้า Machine ค้นหา `CNC` (ข้อความบางส่วนของ ID) และค้นหาด้วยชื่อ `Robot` (ข้อมูล seed) | `CNC` ได้ `CNC-001` และ `CNC-002`, `Robot` ได้ `ROB-001` และ `ROB-002` | [x] | [x] | [x] |
| TC-SRC-04 | REQ-SRC-01 | หน้า Machine กรอง Status และ Type | ผลตรงกับเงื่อนไข | [x] | [x] | [x] |
| TC-SRC-05 | REQ-SRC-03 | หน้า Maintenance กรอง Machine, Status, Technician | ผลตรงกับเงื่อนไข | [x] | [x] | [x] |
| TC-SRC-06 | REQ-SRC-04 | ใช้ Filter หลายตัวแล้วกดล้าง Filter | กลับมาแสดงทั้งหมดในคลิกเดียว | [x] | [x] | [x] |
| TC-SRC-07 | REQ-SRC-05 | กรองแล้ว Refresh หน้า หรือคัดลอก URL ไปเปิดใหม่ | ค่า Filter และผลลัพธ์ยังเหมือนเดิม | [x] | [x] | [x] |
| TC-SRC-08 | REQ-SRC-02 | หน้า Alarm กรองด้วย Alarm Code | ผลตรงกับเงื่อนไข | [x] | [x] | [x] |

## 6. Dashboard

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-DSH-01 | REQ-DSH-01, 02, US-07 | เปิด Dashboard เทียบกับจำนวน Machine จริงในรายการ (เช่น 10 เครื่อง: Running 6, Stop 2, Alarm 1, Maintenance 1) | ตัวเลขรวมและแยก Status ตรงกับข้อมูลจริงทุกช่อง | [x] | [x] | [x] |
| TC-DSH-02 | REQ-DSH-03 | เปรียบเทียบจำนวน Alarm ค้าง (Open + In Progress) และทั้งหมดกับหน้า Alarm | ตรงกัน | [x] | [x] | [x] |
| TC-DSH-03 | REQ-DSH-04 | เปรียบเทียบจำนวน Maintenance ที่ยังไม่เสร็จและทั้งหมดกับหน้า Maintenance | ตรงกัน | [x] | [x] | [x] |
| TC-DSH-04 | REQ-DSH-03 | ปิด Alarm หนึ่งรายการแล้วกลับมาดู Dashboard | จำนวน Alarm ค้างลดลง 1 | [x] | [x] | - |
| TC-DSH-05 | REQ-DSH-05 | ดูรายการ Alarm ล่าสุด | แสดง 5 รายการล่าสุดเรียงตามเวลา และกดลิงก์ไปรายละเอียดได้ | [x] | [x] | [x] |
| TC-DSH-07 | REQ-DSH-01, US-07 | หน้า Dashboard การ์ด Machines: กดตัวเลขรวม จากนั้นย้อนกลับแล้วกดจำนวนของแต่ละสถานะ (Running, Stop, Alarm, Maintenance) | ตัวเลขรวมไป `/machines` ทั้งหมด ส่วนแต่ละสถานะไป `/machines?status=...` และรายการแสดงเฉพาะสถานะนั้น จำนวนเครื่องในรายการเท่ากับตัวเลขที่กด | [x] | [x] | [x] |
| TC-DSH-08 | REQ-DSH-03 | การ์ด Alarms not closed: กดตัวเลขหลัก แล้วกดแถว Open, In Progress, Closed ทีละแถว | ตัวเลขหลักไป `/alarms` ส่วนแต่ละแถวไป `/alarms?status=...` ที่กรองตามสถานะนั้น จำนวนรายการเท่ากับตัวเลขที่กด และตัวกรองสถานะในหน้ารายการตั้งตรงกัน | [x] | [x] | [x] |
| TC-DSH-09 | REQ-DSH-04 | การ์ด Maintenance not finished: กดตัวเลขหลัก แล้วกดแถว Pending, In Progress, Completed ทีละแถว | ไป `/maintenance` และ `/maintenance?status=...` ตามที่กด จำนวนรายการเท่ากับตัวเลขที่กด | [x] | [x] | [x] |
| TC-DSH-10 | REQ-DSH-05 | หน้า Dashboard รายการ Latest alarms: กดตรงไหนก็ได้บนแถว (รหัส, คำอธิบาย, ชื่อเครื่อง) และกด All alarms | กดที่แถวไปหน้ารายละเอียดของ Alarm นั้น กด All alarms ไป `/alarms` | [x] | [x] | [x] |
| TC-DSH-06 | NFR-REL-01, US-07 | จำลองให้ query ของ Dashboard ล้มเหลว **ในเครื่องเท่านั้น** แล้วเปิด Dashboard (ดู Note 3) | แสดง Error State ที่อ่านเข้าใจ ไม่ใช่หน้าว่าง และไม่ขึ้นว่าสำเร็จ | [x] | - | - |

## 7. UI, Responsive และ Usability

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-UI-01 | NFR-USE-01 | ลดความกว้างหน้าจอเหลือ 360 px (DevTools) แล้วเปิดทุกหน้า | ไม่มี Scroll แนวนอน อ่านและกดปุ่มได้ | [x] | [x] | [x] |
| TC-UI-02 | REQ-VAL-03 | ส่งฟอร์มที่ข้อมูลผิดในทุกฟอร์ม | Error แสดงใต้ช่องที่ผิด และบอกว่าต้องแก้อะไร (ข้อความภาษาไทย) | [x] | [x] | - |
| TC-UI-03 | REQ-VAL-05 | บันทึกสำเร็จและบันทึกล้มเหลวในแต่ละฟอร์ม | มีข้อความผลลัพธ์ชัดเจนทั้งสองกรณี | [x] | [x] | - |
| TC-UI-04 | NFR-PERF-02 | เปิดหน้ารายการที่มีข้อมูลเยอะ | แบ่งหน้าไม่เกิน 20–50 รายการต่อหน้า | [x] | [x] | [x] |

## 8. Security

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | ผ่าน |
|---|---|---|---|:-:|
| TC-SEC-01 | NFR-SEC-01, 03 | ค้นใน repo ทั้งโปรเจ็คด้วยคำว่า `service_role`, `SUPABASE_SECRET_KEY`, `sb_secret`, `eyJ` | ไม่พบค่า key จริง (มีแค่ชื่อตัวแปรใน `.env.example` และเอกสารได้) | [x] |
| TC-SEC-02 | NFR-SEC-03 | ตรวจ `git ls-files` และประวัติ commit หาไฟล์ `.env*` | มีเฉพาะ `.env.example` และไม่มีค่าจริง | [x] |
| TC-SEC-03 | NFR-SEC-01 | ค้นหา `NEXT_PUBLIC_` ในโค้ดและตั้งค่า Vercel | ไม่มีตัวแปร `NEXT_PUBLIC_*` ที่เก็บ Secret หรือ Service Role Key | [x] |
| TC-SEC-04 | NFR-SEC-01 | เปิด DevTools > Network / Sources บน Vercel URL แล้วค้นหา Secret Key | ไม่พบ Service Role Key ในโค้ดฝั่ง Client | [x] |
| TC-SEC-05 | NFR-SEC-02 | ตรวจใน Supabase ว่าทุกตารางเปิด RLS | ทุกตารางเปิด RLS และมี Policy ตรงกับ Permission Matrix (ไม่มี Policy เขียนข้อมูลที่ให้ role `viewer`) | [x] |
| TC-SEC-06 | AGENTS.md | ตรวจ Screenshot และ log ที่จะส่งงาน | ไม่มี Secret, Email ผู้ใช้จริง หรือรหัสผ่านปรากฏ | [x] |

## 9. CI และ Deploy

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | ผ่าน |
|---|---|---|---|:-:|
| TC-CI-01 | CON-04 | ดูผล GitHub Actions ของ commit ล่าสุดบน `main` | ขึ้นเขียว (lint, build, test ผ่าน) | [x] |
| TC-CI-02 | CON-05 | เปิด Vercel URL จากเครื่องอื่น/เบราว์เซอร์ที่ไม่เคย Login | เปิดได้ และ Login ได้จริง | [x] |
| TC-CI-03 | 8.1 | Login บน Vercel URL ด้วย Admin, Technician และ Viewer | Login สำเร็จและ Logout กลับมาหน้า Login ได้ (Redirect URL ตั้งถูก) | [x] |

## Bonus (ทดสอบเฉพาะที่ทำจริง)

ช่อง **A** / **T** / **V** ใช้เหมือนหมวดอื่น ใส่ `-` เมื่อ Role นั้นไม่เกี่ยวกับข้อนี้ ข้อที่ต้องสร้างข้อมูลทดสอบ ดู Notes ข้อ 4

| ID | Feature | ขั้นตอน | ผลที่คาดหวัง | A | T | V |
|---|---|---|---|:-:|:-:|:-:|
| TC-BNS-01 | 9.1 Waiting Part | (ยังไม่ได้ทำ) ตั้ง Maintenance เป็น `Waiting Part` และดู Filter, Dashboard | ข้ามข้อนี้ เพราะระบบยังไม่มีสถานะ Waiting Part (TC-MNT-08 ระบุสถานะที่มีอยู่) ถ้าภายหลังทำเพิ่ม ให้กลับมาทดสอบ | - | - | - |
| TC-BNS-02a | 9.2, REQ-SRC-06 | หน้า Alarms กรอง Occurred from / Occurred to เป็นช่วงที่มีข้อมูล แล้วกด Search | แสดงเฉพาะ Alarm ที่เกิดในช่วงนั้น (รวมทั้งวันแรกและวันสุดท้าย) และค่าวันที่ยังอยู่ในช่องหลังโหลดหน้า | [x] | [x] | [x] |
| TC-BNS-02b | 9.2, REQ-SRC-06 | หน้า Maintenance กรอง Started from / Started to ตาม Start date | แสดงเฉพาะงานที่เริ่มในช่วงนั้น รวมทั้งวันแรกและวันสุดท้าย | [x] | [x] | [x] |
| TC-BNS-02c | 9.2 | กรอกเพียงช่องเดียว (เฉพาะ From หรือเฉพาะ To) ทั้งสองหน้า | From อย่างเดียว = ตั้งแต่วันนั้นเป็นต้นไป, To อย่างเดียว = ถึงวันนั้น ไม่ Error | [x] | [x] | [x] |
| TC-BNS-02d | 9.2 | ตั้งวันเริ่มต้น (From) **หลัง** วันสิ้นสุด (To) ทั้งสองหน้า แล้วกด Search | มีข้อความสีแดงใต้ช่องวันที่ "วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด กรุณาเลือกช่วงวันที่ใหม่ (ตอนนี้ยังไม่ได้กรองตามวันที่)" ไม่ขึ้น Error หน้าแตก ค่าที่กรอกยังอยู่ในช่อง รายการไม่ถูกกรองตามวันที่ และเมื่อแก้เป็นช่วงที่ถูกต้องแล้วกรองได้ตามปกติ | [x] | [x] | [x] |
| TC-BNS-02e | 9.2 | **วันสุดท้ายตอนดึก:** เตรียม Alarm สองรายการตาม Notes ข้อ 4 (เวลาไทย 23:30 ของวัน D และ 00:30 ของวัน D+1) แล้วกรอง From = To = D, จากนั้น From = To = D+1, จากนั้น From = D To = D+1 | วัน D เห็นเฉพาะ Alarm 23:30, วัน D+1 เห็นเฉพาะ Alarm 00:30, ช่วง D ถึง D+1 เห็นทั้งสอง (วันนับตามเวลาไทย ไม่ใช่ UTC) | [x] | - | [x] |
| TC-BNS-02f | 9.2 | กรองด้วยช่วงวันที่ร่วมกับ Machine และ Status (ทั้งสองหน้า) แล้ว Refresh หรือคัดลอก URL ไปเปิดใหม่ จากนั้นกดล้าง Filter | ผลตรงกับทุกเงื่อนไขพร้อมกัน ค่าเดิมยังอยู่หลัง Refresh และClear แล้วช่องวันที่ว่างและแสดงรายการทั้งหมด | [x] | [x] | [x] |
| TC-BNS-03a | 9.3, REQ-AUTH-08 | Login เป็น Viewer ดู Navbar | ไม่มีเมนู Users ป้ายแสดง `viewer` มีปุ่ม Logout และ Theme | - | - | [x] |
| TC-BNS-03b | 9.3, REQ-AUTH-08 | Viewer เปิด Dashboard, Machines, Alarms, Maintenance, หน้ารายละเอียดของแต่ละรายการ | เห็นข้อมูลครบเหมือน Role อื่น และใช้ Filter กับแบ่งหน้าได้ | - | - | [x] |
| TC-BNS-03c | 9.3, REQ-AUTH-08 | Viewer ดูทุกหน้าหาปุ่มหรือฟอร์มที่เขียนข้อมูล: Machines (เพิ่ม, แก้ไข, ลบ), Alarms (สร้าง), หน้า Alarm (แก้ไข, ฟอร์มเปลี่ยนสถานะ, Record maintenance), Maintenance (New record, แก้ไข) | ไม่เห็นปุ่มหรือฟอร์มเหล่านี้เลย | - | - | [x] |
| TC-BNS-03d | 9.3, REQ-AUTH-08 | Viewer เปิด URL ตรงๆ: `/machines/new`, `/machines/[id]/edit`, `/alarms/new`, `/alarms/[id]/edit`, `/maintenance/new`, `/maintenance/[id]/edit`, `/users` | ทุกหน้าถูกพากลับ Dashboard พร้อมข้อความ "คุณไม่มีสิทธิ์เข้าหน้านั้น" | - | - | [x] |
| TC-BNS-03e | 9.3, NFR-SEC-02 | Viewer สั่งผ่าน Supabase Client โดยตรง (ดู Notes ข้อ 2): insert / update / delete `machines`, insert `alarms`, update สถานะ `alarms`, insert และ update `maintenance_records`, update `role` ของตนเอง | RLS ปฏิเสธทุกคำสั่งหรือไม่มีแถวถูกแก้ ข้อมูลไม่เปลี่ยน | - | - | [x] |
| TC-BNS-03f | 9.3, REQ-AUTH-09 | Viewer แก้ชื่อตนเองที่ `/profile` และกด Export CSV ในหน้า Alarms และ Maintenance | แก้ชื่อได้ (ไม่มีช่อง Role) และ Export ได้ไฟล์ตามปกติ | - | - | [x] |
| TC-BNS-03g | 9.3, REQ-AUTH-07 | Admin เปิด `/users` ตั้ง Role ผู้ใช้เป็น `viewer` แล้ว Login ด้วยบัญชีนั้น จากนั้นหน้า Maintenance สร้างหรือแก้งานแล้วเปิดช่อง Technician | ตั้ง Role ได้ และผู้ใช้นั้นเห็นสิทธิ์แบบ Viewer เมื่อ Login ใหม่ รายการในช่อง Technician ไม่มีผู้ใช้ที่เป็น Viewer (ยกเว้นเจ้าของงานเดิมของระเบียนที่แก้อยู่) | [x] | - | [x] |
| TC-BNS-03h | 9.3 | Admin เปลี่ยน Technician ที่มีงานซ่อมอยู่เป็น Viewer แล้วให้เขา Login ใหม่ ลองแก้งานซ่อมเดิมและเปลี่ยนสถานะ Alarm จากนั้น Admin เปิดงานเดิมนั้นแก้ไขแล้วบันทึก | Viewer แก้งานเดิมและเปลี่ยนสถานะ Alarm ไม่ได้ ส่วน Admin ยังแก้งานเดิมได้ (ถ้า Admin เปลี่ยนผู้รับผิดชอบเป็น Viewer ต้องถูกปฏิเสธและมีข้อความไทยใต้ช่อง Technician) | [x] | - | [x] |
| TC-BNS-03i | 9.3 | หลังเพิ่ม Role Viewer ให้ Admin และ Technician ลองใช้งานเขียนข้อมูลตามปกติ: Admin เพิ่ม/แก้ Machine, สร้าง Alarm, สร้างและแก้ Maintenance, Technician เปลี่ยนสถานะ Alarm และสร้าง Maintenance ในชื่อตนเอง | ทำได้ทั้งหมดเหมือนเดิม (ไม่ได้ถูกจำกัดสิทธิ์ตามไปด้วย) และ Technician ยังทำสิ่งที่ Admin ทำไม่ได้ตามเดิม | [x] | [x] | - |
| TC-BNS-04a | 9.4 | Export CSV ในหน้า Alarms และ Maintenance โดยไม่ใส่ตัวกรอง | ได้ไฟล์ `alarms-YYYY-MM-DD.csv` และ `maintenance-YYYY-MM-DD.csv` (วันที่ตามเวลาไทย) มีแถวหัวตาราง จำนวนแถวข้อมูลเท่ากับจำนวนในหน้ารายการ (ถ้าไม่เกิน 5,000 แถว) | [x] | [x] | [x] |
| TC-BNS-04b | 9.4 | ตั้งตัวกรองในหน้ารายการ (เช่น Status, Machine และช่วงวันที่) แล้วกด Export CSV | ไฟล์มีเฉพาะแถวที่ตรงตัวกรองที่เลือกอยู่ จำนวนเท่ากับผลในหน้าจอทุกหน้า (ไม่ใช่เฉพาะหน้าที่ 1) ข้อมูลในแต่ละคอลัมน์ตรงกับหน้าจอ รวมทั้งเวลาเป็นเวลาไทย | [x] | [x] | [x] |
| TC-BNS-04c | 9.4 | เปิดไฟล์ที่ Export ใน Excel โดยดับเบิลคลิก (ข้อมูลต้องมีภาษาไทย เช่น ชื่อเครื่อง, คำอธิบาย Alarm, Cause) | ภาษาไทยอ่านได้ถูกต้องไม่เป็นตัวอักษรเพี้ยน ทุกคอลัมน์ตรงหัวตารางและไม่เลื่อน | [x] | [x] | [x] |
| TC-BNS-04d | 9.4, NFR-SEC | **CSV injection:** สร้างระเบียนทดสอบที่ข้อความขึ้นต้นด้วย `=` (Alarm: Description `=1+1`, Maintenance: Problem `=1+1`) แล้ว Export และเปิดใน Excel | ในช่องแสดงข้อความ `=1+1` ส่วนแถบสูตรแสดง `'=1+1` ไม่ถูกคำนวณเป็น 2 | [x] | [x] | - |
| TC-BNS-04e | 9.4 | ในระเบียนทดสอบใส่ข้อความที่มีเครื่องหมายจุลภาค เครื่องหมายคำพูด `"` และขึ้นบรรทัดใหม่ (เช่นใน Action Taken) แล้ว Export และเปิดใน Excel | ข้อความอยู่ในช่องเดียวครบทุกตัวอักษร ไม่ทำให้คอลัมน์ในแถวนั้นหรือแถวถัดไปเลื่อน | [x] | [x] | - |
| TC-BNS-04f | 9.4 | กรองจนไม่มีข้อมูลตรง แล้วกด Export CSV และเปิด URL `/alarms/export` ในหน้าต่างที่ยังไม่ Login | กรณีไม่มีข้อมูล ได้ไฟล์ที่มีแต่แถวหัวตาราง ไม่ Error ส่วนกรณีไม่ได้ Login ไม่ได้ไฟล์และถูกพาไป `/login` | [x] | - | - |
| TC-BNS-05a | 9.5 | กดปุ่ม Theme ใน Navbar ทีละครั้งแล้วเปิดทุกหน้า (Login, Dashboard, Machines, Alarms, Maintenance, Users, Profile, ฟอร์ม, กล่องยืนยันลบ) | หมุนเวียน Light, Dark, System ข้อความของปุ่มเปลี่ยนตาม ทุกหน้าอ่านได้ชัด ตัวหนังสือไม่กลืนกับพื้น Status Badge ยังมีทั้งสีและข้อความ | [x] | [x] | [x] |
| TC-BNS-05b | 9.5 | เลือก Dark แล้ว Refresh หน้า, ปิดแล้วเปิดแท็บใหม่ และ Logout แล้ว Login ใหม่ (เบราว์เซอร์เดิม) | ยังเป็น Dark ตามที่เลือก และไม่เห็นหน้าขาวแวบก่อนเข้า Dark | [x] | [x] | [x] |
| TC-BNS-05c | 9.5 | ตั้ง Theme เป็น System แล้วเปลี่ยนโหมดของเครื่องหรือจำลองใน DevTools (Rendering > Emulate CSS media feature prefers-color-scheme) ระหว่างเปิดหน้าอยู่ | สีหน้าเว็บเปลี่ยนตามเครื่องทันทีโดยไม่ต้อง Refresh | [x] | [x] | [x] |
| TC-BNS-05d | 9.5 | **หลายแท็บ:** เปิดระบบ 2 แท็บในเบราว์เซอร์เดียวกัน เปลี่ยน Theme ในแท็บแรก (Light, Dark, System) แล้วดูแท็บที่สอง **โดยไม่ Refresh** | แท็บที่สองเปลี่ยนทั้งสีหน้าเว็บและข้อความของปุ่ม Theme ตามทันที ไม่ใช่เปลี่ยนแค่ข้อความ | [x] | [x] | [x] |
| TC-BNS-05e | 9.5 | **เน็ตช้า:** DevTools > Network ตั้ง Slow 3G และติ๊ก Disable cache ตั้ง Theme เป็น Dark แล้วกด Hard reload (Ctrl+Shift+R) หลายหน้า และดูตั้งแต่เริ่มโหลด | พื้นหลังเป็นสีเข้มตั้งแต่เฟรมแรก ไม่มีหน้าขาวแวบแล้วค่อยเปลี่ยน (ปุ่ม Theme อาจแสดงคำว่า System สั้นๆ ก่อนเปลี่ยนเป็นค่าที่เลือก ถือว่าปกติ) แล้วทำซ้ำกับ Light บนเครื่องที่ตั้งเป็นโหมดมืด ต้องไม่มีหน้ามืดแวบ | [x] | [x] | [x] |
| TC-BNS-05f | 9.5, NFR-USE-01 | ลดความกว้างเหลือ 360 px ใน Dark เปิดเมนูที่พับ ดูหน้ารายการ (การ์ด) และฟอร์ม | ปุ่ม Theme อยู่ในเมนูที่พับ ใช้งานได้ ไม่มี Scroll แนวนอน อ่านได้ชัด | [x] | [x] | [x] |

## Notes

1. **Open Questions**: ข้อ TC-AUTH-09, TC-ALM-10 และ TC-MNT-04 ใช้ค่าเริ่มต้นของ OQ-01 และ OQ-02
   (Technician สร้าง Alarm ไม่ได้ และแก้ Maintenance ของคนอื่นไม่ได้) ถ้าคำตอบของ OQ เปลี่ยน ต้องแก้ข้อเหล่านี้ด้วย
2. **TC-AUTH-08 / 09**: การเรียก Supabase Client โดยตรงต้องใช้ session ของ Technician จริง
   ทำได้โดยเปิด Console บนหน้าเว็บที่ Login แล้ว หรือเขียน script ชั่วคราวในเครื่อง
   ห้าม commit script หรือ token ลง repo
3. **TC-DSH-06**: ทดสอบในเครื่องเท่านั้น ห้ามทดสอบบน Preview หรือ Production (ตัดสินใจใน issue #17)
   ไม่ใช้วิธีใส่ `NEXT_PUBLIC_SUPABASE_URL` ผิด เพราะ `proxy.ts` จะตรวจ session ไม่ได้และส่งไป `/login`
   ทุกครั้ง จึงไม่มีทางเห็น Error State ของ Dashboard ให้ทำให้ query ของ Dashboard ล้มเหลวแทน:
   1. รัน `npm run dev` และ Login ด้วยบัญชีจริง
   2. ใน `features/dashboard/queries.ts` ฟังก์ชัน `listRecentAlarms` แก้ `.order("occurred_at", ...)`
      เป็นคอลัมน์ที่ไม่มีจริงชั่วคราว เช่น `.order("occurred_at_x", ...)` แล้ว save
   3. เปิด Dashboard ตรวจว่าแสดง "โหลดข้อมูล Dashboard ไม่สำเร็จ" แทนตัวเลข ไม่ใช่หน้าว่างหรือตัวเลข 0
   4. **คืนไฟล์** ด้วย `git checkout -- features/dashboard/queries.ts` แล้วตรวจว่า Dashboard กลับมาปกติ
      และ `git status` ไม่มีไฟล์นี้ค้าง
4. **เตรียมข้อมูลทดสอบ (TC-BNS-02e, TC-BNS-04d/e) และเก็บกวาด**
   - ใช้เครื่องสำหรับทดสอบโดยเฉพาะ (เช่น Machine ID `TST-001` สร้างโดย Admin) แล้วตั้งชื่อ Alarm Code ขึ้นต้น `TST-`
     อย่าใช้ข้อมูลจริง Alarm ลบไม่ได้ และ Machine ที่มี Alarm หรือ Maintenance ผูกอยู่ก็ลบไม่ได้ (BR-MCH-02)
     ข้อมูลที่สร้างจึงค้างในระบบ ระหว่างทดสอบให้ปิด Alarm (Closed) และตั้งงานซ่อมเป็น Completed เพื่อไม่ให้นับเป็นรายการค้างใน Dashboard
   - **เก็บกวาดหลังจบ 10.2:** Production ใช้ Database เดียวกับที่อาจารย์จะเห็น จึงต้องลบข้อมูล `TST-` ออกให้หมด Pattarakorn ทำทาง
     Supabase SQL Editor: `select` ดูข้อมูลของเครื่อง `TST-001` ก่อน (Alarm และ Maintenance ที่ผูกอยู่) แล้วลบในคำสั่งเดียวกันภายใน transaction เดียว
     เจาะจงเครื่อง `TST-001` เท่านั้น ลบ Maintenance, Alarm แล้วจึงลบเครื่อง จากนั้นเปิด Dashboard ต้องกลับเป็นตัวเลขของ seed
     (Machine 10 เครื่อง: Running 6, Stop 2, Alarm 1, Maintenance 1)
   - TC-BNS-02e: Admin สร้าง Alarm 2 รายการที่ `TST-001` โดยใส่วันที่เป็นอดีตอย่างน้อย 2 วัน (เวลาที่กรอกถือเป็นเวลาไทย)
     รายการแรก Occurred At = วัน D เวลา 23:30 รายการที่สอง = วัน D+1 เวลา 00:30 ดูในรายการต้องขึ้นเวลาเดิมตามที่กรอก
   - TC-BNS-04d/e: Alarm Description `=1+1` (Alarm Code ต้องเป็นตัวอักษรอังกฤษ ตัวเลข หรือขีด จึงใช้ช่อง Description) และ Maintenance Problem
     `=1+1` ส่วนข้อความที่มีจุลภาค `"` และขึ้นบรรทัดใหม่ ให้ใส่ใน Action Taken (ช่องหลายบรรทัด)
   - TC-BNS-04c: ข้อมูล seed เป็นภาษาอังกฤษทั้งหมด จึงต้องใส่คำไทยในข้อมูลทดสอบด้วย เช่น Cause ของ Alarm `TST-` เป็น `น้ำมันรั่ว, ความดันต่ำ`
     และ Problem ของ Maintenance เป็นภาษาไทย แล้วดูว่าในไฟล์ที่เปิดใน Excel อ่านได้ถูกต้อง
   - รายการสำหรับ Export ที่มีเกิน 5,000 แถว (ไฟล์ชื่อลงท้าย `-partial`) ทดสอบด้วย unit test ในเครื่อง ไม่ต้องสร้างข้อมูลบน Vercel
5. **TC-BNS-05 (Dark mode):** ใช้ DevTools ของ Chrome หรือ Edge (กด F12) ตั้ง Throttling ที่แท็บ Network และตั้ง
   `prefers-color-scheme` ที่เมนู ⋮ > More tools > Rendering ค่า Theme ที่เลือกเก็บใน localStorage ของเบราว์เซอร์นั้น
   (เปลี่ยนเครื่องหรือเบราว์เซอร์แล้วต้องเลือกใหม่) ข้อ 05d ต้องเป็นหน้าต่างเบราว์เซอร์เดียวกัน ไม่ใช่โหมด Private คนละหน้าต่าง

## บั๊กที่พบ

| # | Test ID | อาการ | Role ที่เจอ | ผู้รับผิดชอบ | สถานะ |
|---|---|---|---|---|---|
| 1 | — | ไม่พบบั๊กจากการทดสอบรอบ 10.2 | — | — | — |
| 2 | TC-BNS-03c | พบหลังรอบ 10.2 ระหว่างถ่าย Screenshot (11.4): Viewer เปิด Alarm ที่ยัง Open หรือ In Progress แล้วเห็นข้อความ "This alarm is closed. Only an admin can reopen it." สิทธิ์ยังถูกต้อง ผิดแค่ข้อความ (issue #56) | Viewer | Pattarakorn | แก้แล้ว แสดงข้อความ read-only ตาม Role |
