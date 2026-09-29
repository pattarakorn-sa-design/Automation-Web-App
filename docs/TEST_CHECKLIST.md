# Test Checklist

Checklist สำหรับทดสอบระบบก่อนส่งงาน (งาน 10.1 / 10.2) อ้างอิง Acceptance Criteria ในหัวข้อ 11
และ Traceability ในหัวข้อ 13 ของ `docs/REQUIREMENTS.md`

## วิธีใช้

- ทดสอบบน **Vercel URL** ด้วยบัญชี Admin และ Technician สลับกัน
- ช่อง **A** = ผลเมื่อ Login เป็น Admin, ช่อง **T** = ผลเมื่อ Login เป็น Technician
  - ใส่ `[x]` เมื่อผ่าน, `[ ]` เมื่อยังไม่ได้ทดสอบหรือไม่ผ่าน, `-` เมื่อ Role นั้นไม่เกี่ยวกับข้อนี้
- ถ้าไม่ผ่าน ให้จดไว้ในตาราง **บั๊กที่พบ** ท้ายไฟล์ แล้วแจ้งเจ้าของงาน (ระบบ = Pattarakorn, UI = Phakkathima)
- **ห้ามเขียน Email, รหัสผ่าน หรือ key จริงลงไฟล์นี้** บัญชีทดสอบให้ส่งกันทางแชทส่วนตัว
- ข้อมูลตัวอย่างมาจาก `supabase/seed.sql` (มี Machine 10 เครื่อง) ถ้ายังไม่ได้ seed ให้ข้ามข้อที่ต้องใช้ข้อมูลเดิม

## 1. Authentication และสิทธิ์

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-AUTH-01 | REQ-AUTH-01, US-01 | เปิด `/login` กรอก Email และรหัสผ่านที่ถูกต้อง | เข้า Dashboard และเห็นเมนูตาม Role | [ ] | [ ] |
| TC-AUTH-02 | US-01 | Login ด้วยรหัสผ่านผิด | อยู่หน้าเดิมและแสดง "Email หรือรหัสผ่านไม่ถูกต้อง" | [ ] | [ ] |
| TC-AUTH-03 | REQ-AUTH-03, US-01 | ยังไม่ Login แล้วเปิด `/`, `/machines`, `/alarms`, `/maintenance` ตรงๆ | ถูก Redirect ไป `/login` ทุกหน้า | [ ] | - |
| TC-AUTH-04 | REQ-AUTH-02 | กด Logout จากหน้าใดก็ได้ แล้วกด Back ของเบราว์เซอร์ หรือเปิด `/machines` | กลับไป `/login` และเข้าหน้าที่ต้อง Login ไม่ได้ | [ ] | [ ] |
| TC-AUTH-05 | REQ-AUTH-05, US-03 | Login เป็น Technician แล้วเปิด `/users` ตรงๆ | ถูกปฏิเสธหรือ Redirect | - | [ ] |
| TC-AUTH-06 | REQ-AUTH-05, US-03 | Login เป็น Technician แล้วเปิด `/machines/new` และ `/machines/[id]/edit` ตรงๆ | ถูกปฏิเสธหรือ Redirect | - | [ ] |
| TC-AUTH-07 | REQ-AUTH-05 | Login เป็น Technician แล้วเปิด `/alarms/new` ตรงๆ | ถูกปฏิเสธหรือ Redirect | - | [ ] |
| TC-AUTH-08 | REQ-AUTH-06, NFR-SEC-02, US-03 | Login เป็น Technician แล้วสั่ง insert / update / delete ตาราง `machines` ผ่าน Supabase Client โดยตรง (ไม่ผ่านหน้าเว็บ) | RLS ปฏิเสธทุกคำสั่ง ข้อมูลไม่เปลี่ยน | - | [ ] |
| TC-AUTH-09 | REQ-AUTH-06 | Login เป็น Technician แล้วสั่ง insert ตาราง `alarms` ผ่าน Supabase Client โดยตรง | RLS ปฏิเสธ (Technician สร้าง Alarm ไม่ได้ ตาม OQ-01) | - | [ ] |
| TC-AUTH-10 | REQ-AUTH-07 | Admin เปิด `/users` และลองเปลี่ยน Role ของตนเอง | ทำไม่ได้ และมีข้อความบอกเหตุผล | [ ] | - |
| TC-AUTH-11 | REQ-AUTH-07 | Admin เปลี่ยน Role ของผู้ใช้อื่นจาก technician เป็น admin แล้วกลับ | เปลี่ยนสำเร็จ และสิทธิ์ของผู้ใช้นั้นเปลี่ยนตามเมื่อ Login ใหม่ | [ ] | - |
| TC-AUTH-12 | UI | ดูเมนู Navbar / Sidebar หลัง Login | Admin เห็นเมนู Users, Technician ไม่เห็น และมีปุ่ม Logout ทั้งสอง Role | [ ] | [ ] |

## 2. Machine Master

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-MCH-01 | REQ-MCH-01, US-02 | เพิ่ม Machine ใหม่ (เช่น `M-101`) ด้วยข้อมูลครบ | บันทึกสำเร็จและเห็นในรายการ `/machines` | [ ] | - |
| TC-MCH-02 | REQ-MCH-03, US-02 | เพิ่ม Machine ID ที่มีอยู่แล้ว (ทดสอบทั้ง `M-101` และ `m-101`) | ไม่บันทึก และแสดงข้อความว่า Machine ID ซ้ำ (ดู Note 1) | [ ] | - |
| TC-MCH-03 | REQ-VAL-01, US-02 | เว้นช่อง Machine Name ว่าง หรือใส่แต่ช่องว่าง แล้วกดบันทึก | แสดง Error ใต้ช่องนั้นและไม่ส่งข้อมูล | [ ] | - |
| TC-MCH-04 | REQ-MCH-06, BR-MCH-02 | ลบ Machine ที่มี Alarm หรือ Maintenance ผูกอยู่ | ลบไม่ได้ และแจ้งเหตุผลที่อ่านเข้าใจ | [ ] | - |
| TC-MCH-05 | REQ-MCH-07 | ลบ Machine ที่ไม่มีข้อมูลผูกอยู่ | มีกล่องยืนยันก่อนลบ กดยกเลิกแล้วไม่ถูกลบ กดยืนยันแล้วถูกลบ | [ ] | - |
| TC-MCH-06 | REQ-MCH-02 | ใส่ Machine ID ผิดรูปแบบ (เช่น `abc`, `M001`, `TOOLONG-1`) | แสดง Error ระบุรูปแบบที่ถูกต้อง เช่น `M-001` | [ ] | - |
| TC-MCH-07 | REQ-MCH-02 | ใส่ Machine ID เป็นตัวพิมพ์เล็ก เช่น `cnc-002` | ระบบแปลงเป็นตัวพิมพ์ใหญ่ `CNC-002` ก่อนบันทึก | [ ] | - |
| TC-MCH-08 | REQ-MCH-04 | เปลี่ยน Status ของ Machine ในหน้าแก้ไข | เลือกได้เฉพาะ Running, Stop, Alarm, Maintenance | [ ] | - |
| TC-MCH-09 | REQ-MCH-05 | ดูรายการและรายละเอียด Machine | เห็นข้อมูลได้ทุก Role | [ ] | [ ] |
| TC-MCH-10 | REQ-VAL-04 | กดบันทึกฟอร์มแล้วสังเกตปุ่ม | ปุ่ม Submit ถูก Disable ระหว่างส่ง กดซ้ำไม่ได้ | [ ] | - |
| TC-MCH-11 | NFR-USE-02 | ดู Status Badge | Running=เขียว, Stop=เทา, Alarm=แดง, Maintenance=เหลือง และมีข้อความกำกับ | [ ] | [ ] |

## 3. Alarm Record

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-ALM-01 | REQ-ALM-01, REQ-ALM-02 | สร้าง Alarm ใหม่ครบทุกช่อง | บันทึกสำเร็จ Status เริ่มต้นเป็น `Open` | [ ] | - |
| TC-ALM-02 | REQ-VAL-03 | สร้าง Alarm โดยใส่ Occurred At เป็นเวลาในอนาคต หรือ Alarm Code ผิดรูปแบบ | แสดง Error ใต้ช่องที่ผิดและไม่บันทึก | [ ] | - |
| TC-ALM-03 | REQ-ALM-04, US-04 | เปลี่ยน Alarm จาก `Open` เป็น `In Progress` | บันทึกสำเร็จ และ `updated_at` เปลี่ยน | [ ] | [ ] |
| TC-ALM-04 | BR-ALM-03, US-04 | เปลี่ยน Alarm ที่ยังไม่มี Cause เป็น `Closed` | ไม่บันทึก และแจ้งให้กรอก Cause และ Action Taken | [ ] | [ ] |
| TC-ALM-05 | BR-ALM-03, BR-ALM-04, US-04 | กรอก Cause และ Action Taken ครบแล้วปิด Alarm | ปิดสำเร็จ บันทึก `closed_by` และ `closed_at` และ Alarm ไม่ถูกนับเป็นค้างใน Dashboard | [ ] | [ ] |
| TC-ALM-06 | BR-ALM-02, US-04 | Technician พยายามเปลี่ยนสถานะ Alarm ที่ `Closed` แล้ว | ถูกปฏิเสธ | - | [ ] |
| TC-ALM-07 | BR-ALM-02, BR-ALM-04 | Admin เปิด Alarm ที่ปิดแล้วกลับมา (Reopen) | ทำได้ และ `closed_by` / `closed_at` ถูกล้างค่า | [ ] | - |
| TC-ALM-08 | BR-ALM-01 | ลองเปลี่ยนสถานะที่ไม่อยู่ในลำดับที่อนุญาต (เช่น Closed → In Progress โดย Technician) | ถูกปฏิเสธ | [ ] | [ ] |
| TC-ALM-09 | REQ-ALM-05 | Admin แก้ไข code, description, เวลา ของ Alarm | แก้ได้ | [ ] | - |
| TC-ALM-10 | REQ-ALM-05 | Technician เปิดหน้า Alarm และดูว่ามีปุ่มหรือฟอร์มแก้ไขรายละเอียดหรือไม่ | ไม่มีให้แก้ (ถ้าเรียก Action ตรงๆ ต้องถูกปฏิเสธ) | - | [ ] |
| TC-ALM-11 | REQ-ALM-08 | มองหาปุ่มหรือฟังก์ชันลบ Alarm | ไม่มีการลบ Alarm | [ ] | [ ] |
| TC-ALM-12 | REQ-ALM-06 | ดูรายการและรายละเอียด Alarm | เห็นข้อมูลได้ทุก Role | [ ] | [ ] |

## 4. Maintenance Record

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-MNT-01 | REQ-MNT-01, US-05 | สร้าง Maintenance Record ด้วยข้อมูลครบ | เห็นรายการใหม่ในหน้า Maintenance (และใน History ของเครื่องถ้ามี) | [ ] | [ ] |
| TC-MNT-02 | BR-MNT-02, US-05 | ตั้ง Status เป็น `Completed` โดยไม่มี Action Taken หรือ End Date | แสดง Error และไม่บันทึก | [ ] | [ ] |
| TC-MNT-03 | REQ-VAL-01, US-05 | ตั้ง End Date ก่อน Start Date | แสดง Error และไม่บันทึก | [ ] | [ ] |
| TC-MNT-04 | BR-MNT-01, US-05 | Technician พยายามแก้ Maintenance ของ Technician คนอื่น | ถูกปฏิเสธ (ทั้งหน้าเว็บและ RLS) | - | [ ] |
| TC-MNT-05 | BR-MNT-01 | Technician แก้ Maintenance ของตนเอง | แก้ได้ | - | [ ] |
| TC-MNT-06 | REQ-MNT-05 | Admin แก้ Maintenance ของทุกคน | แก้ได้ | [ ] | - |
| TC-MNT-07 | REQ-MNT-03, BR-MNT-03 | เลือก Alarm ที่เป็นของ Machine คนละเครื่องกับที่เลือกไว้ | ถูกปฏิเสธ | [ ] | [ ] |
| TC-MNT-08 | REQ-MNT-04 | เปลี่ยน Status | เลือกได้เฉพาะ Pending, In Progress, Completed | [ ] | [ ] |
| TC-MNT-09 | REQ-MNT-06 | ดูรายการและรายละเอียด Maintenance | เห็นข้อมูลได้ทุก Role | [ ] | [ ] |

## 5. Search และ Filter

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-SRC-01 | REQ-SRC-02, US-06 | หน้า Alarm เลือก Machine = `M-001` และ Status = `Open` พร้อมกัน | แสดงเฉพาะ Alarm ที่ตรงทั้งสองเงื่อนไข | [ ] | [ ] |
| TC-SRC-02 | REQ-SRC-07, US-06 | กรองด้วยเงื่อนไขที่ไม่มีข้อมูลตรง | แสดง "ไม่พบข้อมูล" ไม่ใช่ตารางว่าง | [ ] | [ ] |
| TC-SRC-03 | REQ-SRC-01 | หน้า Machine ค้นหา `M-00` (ข้อความบางส่วน) และค้นหาด้วยชื่อ | เจอ Machine ที่ตรง ทั้งจาก ID และ Name | [ ] | [ ] |
| TC-SRC-04 | REQ-SRC-01 | หน้า Machine กรอง Status และ Type | ผลตรงกับเงื่อนไข | [ ] | [ ] |
| TC-SRC-05 | REQ-SRC-03 | หน้า Maintenance กรอง Machine, Status, Technician | ผลตรงกับเงื่อนไข | [ ] | [ ] |
| TC-SRC-06 | REQ-SRC-04 | ใช้ Filter หลายตัวแล้วกดล้าง Filter | กลับมาแสดงทั้งหมดในคลิกเดียว | [ ] | [ ] |
| TC-SRC-07 | REQ-SRC-05 | กรองแล้ว Refresh หน้า หรือคัดลอก URL ไปเปิดใหม่ | ค่า Filter และผลลัพธ์ยังเหมือนเดิม | [ ] | [ ] |
| TC-SRC-08 | REQ-SRC-02 | หน้า Alarm กรองด้วย Alarm Code | ผลตรงกับเงื่อนไข | [ ] | [ ] |

## 6. Dashboard

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-DSH-01 | REQ-DSH-01, 02, US-07 | เปิด Dashboard เทียบกับจำนวน Machine จริงในรายการ (เช่น 10 เครื่อง: Running 6, Stop 2, Alarm 1, Maintenance 1) | ตัวเลขรวมและแยก Status ตรงกับข้อมูลจริงทุกช่อง | [ ] | [ ] |
| TC-DSH-02 | REQ-DSH-03 | เปรียบเทียบจำนวน Alarm ค้าง (Open + In Progress) และทั้งหมดกับหน้า Alarm | ตรงกัน | [ ] | [ ] |
| TC-DSH-03 | REQ-DSH-04 | เปรียบเทียบจำนวน Maintenance ที่ยังไม่เสร็จและทั้งหมดกับหน้า Maintenance | ตรงกัน | [ ] | [ ] |
| TC-DSH-04 | REQ-DSH-03 | ปิด Alarm หนึ่งรายการแล้วกลับมาดู Dashboard | จำนวน Alarm ค้างลดลง 1 | [ ] | [ ] |
| TC-DSH-05 | REQ-DSH-05 | ดูรายการ Alarm ล่าสุด | แสดง 5 รายการล่าสุดเรียงตามเวลา และกดลิงก์ไปรายละเอียดได้ | [ ] | [ ] |
| TC-DSH-06 | NFR-REL-01, US-07 | จำลอง Database ใช้ไม่ได้ (เช่น ใส่ Supabase URL ผิดใน Preview ที่ไม่ใช่ Production) แล้วเปิด Dashboard | แสดง Error State ที่อ่านเข้าใจ ไม่ใช่หน้าว่าง และไม่ขึ้นว่าสำเร็จ | [ ] | - |

## 7. UI, Responsive และ Usability

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-UI-01 | NFR-USE-01 | ลดความกว้างหน้าจอเหลือ 360 px (DevTools) แล้วเปิดทุกหน้า | ไม่มี Scroll แนวนอน อ่านและกดปุ่มได้ | [ ] | [ ] |
| TC-UI-02 | REQ-VAL-03 | ส่งฟอร์มที่ข้อมูลผิดในทุกฟอร์ม | Error แสดงใต้ช่องที่ผิด และบอกว่าต้องแก้อะไร (ข้อความภาษาไทย) | [ ] | [ ] |
| TC-UI-03 | REQ-VAL-05 | บันทึกสำเร็จและบันทึกล้มเหลวในแต่ละฟอร์ม | มีข้อความผลลัพธ์ชัดเจนทั้งสองกรณี | [ ] | [ ] |
| TC-UI-04 | NFR-PERF-02 | เปิดหน้ารายการที่มีข้อมูลเยอะ | แบ่งหน้าไม่เกิน 20–50 รายการต่อหน้า | [ ] | [ ] |

## 8. Security

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | ผ่าน |
|---|---|---|---|:-:|
| TC-SEC-01 | NFR-SEC-01, 03 | ค้นใน repo ทั้งโปรเจ็คด้วยคำว่า `service_role`, `SUPABASE_SECRET_KEY`, `sb_secret`, `eyJ` | ไม่พบค่า key จริง (มีแค่ชื่อตัวแปรใน `.env.example` และเอกสารได้) | [ ] |
| TC-SEC-02 | NFR-SEC-03 | ตรวจ `git ls-files` และประวัติ commit หาไฟล์ `.env*` | มีเฉพาะ `.env.example` และไม่มีค่าจริง | [ ] |
| TC-SEC-03 | NFR-SEC-01 | ค้นหา `NEXT_PUBLIC_` ในโค้ดและตั้งค่า Vercel | ไม่มีตัวแปร `NEXT_PUBLIC_*` ที่เก็บ Secret หรือ Service Role Key | [ ] |
| TC-SEC-04 | NFR-SEC-01 | เปิด DevTools > Network / Sources บน Vercel URL แล้วค้นหา Secret Key | ไม่พบ Service Role Key ในโค้ดฝั่ง Client | [ ] |
| TC-SEC-05 | NFR-SEC-02 | ตรวจใน Supabase ว่าทุกตารางเปิด RLS | ทุกตารางเปิด RLS และมี Policy ตรงกับ Permission Matrix | [ ] |
| TC-SEC-06 | AGENTS.md | ตรวจ Screenshot และ log ที่จะส่งงาน | ไม่มี Secret, Email ผู้ใช้จริง หรือรหัสผ่านปรากฏ | [ ] |

## 9. CI และ Deploy

| ID | Requirement | ขั้นตอน | ผลที่คาดหวัง | ผ่าน |
|---|---|---|---|:-:|
| TC-CI-01 | CON-04 | ดูผล GitHub Actions ของ commit ล่าสุดบน `main` | ขึ้นเขียว (lint, build, test ผ่าน) | [ ] |
| TC-CI-02 | CON-05 | เปิด Vercel URL จากเครื่องอื่น/เบราว์เซอร์ที่ไม่เคย Login | เปิดได้ และ Login ได้จริง | [ ] |
| TC-CI-03 | 8.1 | Login บน Vercel URL ด้วยทั้ง Admin และ Technician | Login สำเร็จและ Logout กลับมาหน้า Login ได้ (Redirect URL ตั้งถูก) | [ ] |

## Bonus (ทดสอบเฉพาะที่ทำจริง)

| ID | Feature | ขั้นตอน | ผลที่คาดหวัง | A | T |
|---|---|---|---|:-:|:-:|
| TC-BNS-01 | 9.1 Waiting Part | ตั้ง Maintenance เป็น `Waiting Part` และดู Filter, Dashboard | บันทึกได้ Filter และ Dashboard นับถูก | [ ] | [ ] |
| TC-BNS-02 | 9.2 Date filter | กรอง Alarm และ Maintenance ตามช่วงวันที่ | แสดงเฉพาะรายการในช่วงนั้น | [ ] | [ ] |
| TC-BNS-03 | 9.3 Viewer | Login เป็น Viewer และลองเพิ่ม แก้ไข เปลี่ยนสถานะ | ทำไม่ได้ทั้งหน้าเว็บและ RLS | - | - |
| TC-BNS-04 | 9.4 Export CSV | Export Alarm และ Maintenance | ได้ไฟล์ที่เปิดได้ ข้อมูลตรงกับหน้าจอ และภาษาไทยไม่เพี้ยน | [ ] | [ ] |
| TC-BNS-05 | 9.5 Dark mode | สลับโหมดมืด และดูบนมือถือ | อ่านได้ชัด ไม่มีส่วนที่ตัวหนังสือกลืนกับพื้น | [ ] | [ ] |

## Notes

1. **ข้อความ Error ของ Machine ID ซ้ำ**: `docs/REQUIREMENTS.md` (US-02) ระบุ "Machine ID นี้มีอยู่แล้ว"
   ส่วนแผนงาน (งาน 4.3) ระบุ "Machine ID already exists" ให้ตกลงกับ A ว่าจะใช้ข้อความไหน
   แล้วแก้ข้อ TC-MCH-02 ให้ตรงกัน (ตาม AGENTS.md ข้อความ Error ที่ผู้ใช้เห็นเป็นภาษาไทย)
2. **Open Questions**: ข้อ TC-AUTH-09, TC-ALM-10 และ TC-MNT-04 ใช้ค่าเริ่มต้นของ OQ-01 และ OQ-02
   (Technician สร้าง Alarm ไม่ได้ และแก้ Maintenance ของคนอื่นไม่ได้) ถ้าคำตอบของ OQ เปลี่ยน ต้องแก้ข้อเหล่านี้ด้วย
3. **TC-AUTH-08 / 09**: การเรียก Supabase Client โดยตรงต้องใช้ session ของ Technician จริง
   ทำได้โดยเปิด Console บนหน้าเว็บที่ Login แล้ว หรือเขียน script ชั่วคราวในเครื่อง
   ห้าม commit script หรือ token ลง repo
4. **TC-DSH-06**: ทดสอบบน Preview URL หรือในเครื่องเท่านั้น ห้ามเปลี่ยนค่าบน Production

## บั๊กที่พบ

| # | Test ID | อาการ | Role ที่เจอ | ผู้รับผิดชอบ | สถานะ |
|---|---|---|---|---|---|
| 1 | | | | | |
