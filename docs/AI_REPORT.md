# รายงานการใช้ AI

รายงานนี้สรุปว่าใช้ AI ทำอะไร ในส่วนไหนของโปรเจ็ค และตรวจสอบผลอย่างไร (งาน 11.5)
ส่วนของ Phakkathima เขียนจากงานที่ทำจริง ส่วนระบบ (Database, Auth, Server Action) ให้ Pattarakorn เติมในหัวข้อ 5

## 1. เครื่องมือและหลักการใช้

| รายการ | รายละเอียด |
|---|---|
| เครื่องมือ | Claude Code (AI coding assistant ที่รันในเครื่อง ผ่านส่วนขยายใน VS Code) |
| ผู้ใช้ | Phakkathima (ส่วน CI, test, components, เอกสาร) |
| วิธีทำงาน | สั่งงานเป็นข้อๆ ให้ AI เขียนหรือแก้ไฟล์ในเครื่อง แล้วผู้ใช้ตรวจ ก่อนสั่งให้ commit และ push |
| ผู้ตัดสินใจ | คน ไม่ใช่ AI: ผู้ใช้เป็นคนสั่ง push, เปิด Pull Request และเลือก Reviewer เอง และอีกคนในทีมเป็นคนรีวิวและ merge |

หลักการที่ตั้งไว้ใน [AGENTS.md](../AGENTS.md) ซึ่ง AI อ่านทุกครั้งที่เริ่มทำงาน

- ทำงานตามขอบเขตของเจ้าของงาน: branch `design/*` แก้ได้เฉพาะ markup, styling และ `components/`
  ห้ามแตะ Server Action, data fetching, validation, migration, RLS และ `lib/supabase/`
  ถ้าต้องแก้ ให้หยุดและถามเจ้าของงาน
- commit ย่อยทีละเรื่อง ข้อความเป็นภาษาอังกฤษ ไม่มีการระบุเครื่องมือ AI ใน commit, PR และคอมเมนต์ในโค้ด
- ก่อน commit ต้องรัน `npm run lint`, `npx tsc --noEmit` และ `npm run build` ให้ผ่าน
- ห้าม commit `.env.local` หรือ key จริง และห้ามให้ Service Role Key ปรากฏในโค้ดฝั่ง Client

เรื่องข้อมูลลับ: การตั้งค่าใน `.env.local` ทำเองโดยผู้ใช้ และในงานที่ผ่านมา AI ไม่ได้เปิดอ่านค่าในไฟล์นั้น
(มีเพียงย้ายไฟล์ชั่วคราวเพื่อทดสอบว่า build ผ่านด้วยค่า dummy แล้วคืนที่เดิม) และผู้ใช้ไม่ได้รับ Service Role Key ตามแผนงานข้อ 0.4

## 2. AI ช่วยทำอะไรบ้าง

| งาน | ส่วนที่ AI ทำ | ส่วนที่คนทำ / ตัดสินใจ | Branch |
|---|---|---|---|
| 1.4 GitHub Actions CI | ร่าง `.github/workflows/ci.yml` (`npm ci` → lint → build → test) | เลือกใช้ค่า dummy แทน GitHub Secrets, ตรวจผล CI บน PR | `ci/github-actions` |
| 1.5 Vitest | ติดตั้ง Vitest, ตั้ง `vitest.config.mts`, เขียน test ของ `getSupabaseEnv` 3 ตัว | ตรวจว่า CI ผ่าน | `ci/github-actions` |
| โน้ตทีม | เขียน `docs/NOTES.md` และเพิ่มลิงก์ใน AGENTS.md | ตัดสินใจว่าจะเก็บอะไรไว้ให้อีกคนรู้ | `ci/github-actions`, `design/components` |
| 4.5 StatusBadge | เขียน component และ test | กำหนดสีและข้อความตามข้อกำหนด | `design/components` |
| 4.6 EmptyState, ErrorState, ConfirmDialog | เขียน component และ test | กำหนดพฤติกรรม (ปุ่ม, การปิด dialog, ข้อความภาษาไทย) | `design/components` |
| แก้บั๊ก ConfirmDialog | แก้ตามบั๊กที่เพื่อนร่วมทีมพบตอนรีวิว | รายงานบั๊กและสั่งให้แก้ | `design/components` |
| 10.1 Test checklist | อ่าน `docs/REQUIREMENTS.md` แล้วร่าง test case ประมาณ 70 ข้อ | ยืนยันข้อความ Error และข้อสมมติที่ยังไม่ชัด | `docs/test-checklist` |
| 11.1 README | ร่างเนื้อหาจาก requirement และไฟล์จริงใน repo | ตรวจข้อมูล เพิ่ม URL และขั้นตอนที่ยังไม่มีภายหลัง | `docs/readme` |
| 11.5 รายงานนี้ | ร่างจากประวัติงานจริง | ตรวจความถูกต้องและเติมส่วนที่ AI ไม่เห็น | `docs/ai-report` |

สิ่งที่ **ไม่ได้** ให้ AI ทำในส่วนนี้: การตั้งค่า Supabase, การสร้างและส่ง key, การเปิด Pull Request และการ merge
