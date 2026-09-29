# รายงานการใช้ AI

รายงานนี้สรุปว่าใช้ AI ทำอะไร ในส่วนไหนของโปรเจ็ค และตรวจสอบผลอย่างไร (งาน 11.5)
หัวข้อ 1–4 เป็นงานของ Phakkathima ส่วนหัวข้อ 5 เป็นงานระบบของ Pattarakorn (Database, Auth, Server Action)

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
(มีเพียงย้ายไฟล์ชั่วคราวเพื่อทดสอบว่า build ผ่านด้วยค่า dummy แล้วคืนที่เดิม) และตามแผนงานข้อ 0.4 ผู้ใช้ไม่ต้องใช้และไม่ได้รับ Service Role Key

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

## 3. ตรวจสอบผลอย่างไร

ไม่เชื่อผลจาก AI โดยอัตโนมัติ ทุกงานผ่านขั้นตอนต่อไปนี้

| วิธีตรวจ | ทำอย่างไร |
|---|---|
| ตรวจอัตโนมัติในเครื่อง | รัน `npm run lint`, `npx tsc --noEmit`, `npm run build` และ `npm test` ก่อน commit ทุกครั้ง |
| CI | GitHub Actions รัน install, lint, build และ test บนทุก push และ Pull Request ต้องขึ้นเขียวก่อน merge |
| ทดสอบว่า test จับบั๊กได้จริง | หลังเพิ่ม regression test ของ ConfirmDialog ได้ลองรันกับโค้ดเก่า test ต้องล้ม แล้วรันกับโค้ดที่แก้ต้องผ่าน |
| ทดสอบ CI แบบไม่พึ่งค่าจริง | ย้าย `.env.local` ออกแล้ว build ด้วยค่า dummy อย่างเดียว เพื่อยืนยันว่า workflow ไม่ต้องใช้ key จริง |
| เทียบกับเอกสาร | ตรวจ test checklist และ README เทียบกับ `docs/REQUIREMENTS.md` และแผนงาน |
| ตรวจข้อมูลลับ | ค้นหา pattern ของ key, JWT และอีเมลในไฟล์ที่เขียนใหม่ก่อน commit |
| ตรวจโดยเพื่อนร่วมทีม | ทุกงานเปิด Pull Request ให้อีกคนรีวิวและเป็นคน merge |
| ตรวจขอบเขต | ดู `git diff` ว่าแก้เฉพาะไฟล์ที่อยู่ในขอบเขตของ branch นั้น |

## 4. ปัญหาที่พบจากการใช้ AI และบทเรียน

| ปัญหา | เกิดอะไรขึ้น | แก้อย่างไร | บทเรียน |
|---|---|---|---|
| **บั๊กใน ConfirmDialog** | AI ใส่ padding ที่ตัว `<dialog>` และตรวจการคลิกพื้นหลังด้วย `event.target === event.currentTarget` ทำให้คลิกที่ขอบด้านในกล่องแล้ว dialog ปิดเอง | Pattarakorn พบตอนรีวิว โค้ดถูกแก้โดยย้าย padding ไปไว้ใน wrapper, เพิ่ม test และแก้กรณีลากเมาส์ที่ตามมา | lint, tsc, build และ test ผ่านหมดแต่บั๊กยังอยู่ เพราะโปรเจ็คยังไม่ได้ทดสอบการคลิกจริง การรีวิวโดยคนและการลองใช้จริงในเบราว์เซอร์จำเป็นเสมอ |
| **ติดตั้ง Vitest ไม่ผ่าน** | `npm install` ล้มด้วย ERESOLVE เพราะ Vitest 5 ต้องการ `@types/node` 22 ขึ้นไป แต่โปรเจ็คใช้ `^20` | อัปเกรด `@types/node` เป็น `^22`, ตรวจว่า build และ test ผ่าน, บันทึกไว้ใน `docs/NOTES.md` เพื่อให้เจ้าของไฟล์รู้ | เปลี่ยน dependency ที่คนอื่นเลือกไว้ต้องบอกเจ้าของและจดเหตุผล |
| **ข้อกำหนดขัดกัน** | ข้อความ Error เมื่อ Machine ID ซ้ำ ในแผนงานเป็นภาษาอังกฤษ แต่ requirement และกฎของโปรเจ็คให้เป็นภาษาไทย | AI ชี้ความขัดแย้งใน test checklist และ Pattarakorn ตัดสินใจใช้ "Machine ID นี้มีอยู่แล้ว" | AI ไม่ควรเลือกเองเมื่อเอกสารขัดกัน ให้ถามเจ้าของงาน |
| **ตีความคำสั่งผิด** | AI เข้าใจผิดในบางคำสั่ง เช่น ข้ามขั้นตอนย่อยของคู่มือ และเข้าใจว่าผู้ใช้จะ push เอง | ผู้ใช้แก้ให้ตรง และ AI แก้ตามทันที | สั่งงานให้ชัด และให้ AI สรุปสิ่งที่จะทำก่อนทำเมื่อเป็นงานที่ส่งผลกับคนอื่น |
| **ข้อจำกัดของเครื่องมือ** | AI โพสต์คอมเมนต์ใน Pull Request เองไม่ได้ เพราะเครื่องไม่มี `gh` CLI | AI เขียนข้อความให้ ผู้ใช้เป็นคนวางเอง | ไม่ทำให้การสื่อสารในทีมขึ้นกับเครื่องมือ |

ข้อจำกัดที่ยังคงอยู่: test ของ component ตรวจได้เฉพาะ HTML ที่เรนเดอร์ ยังไม่มีการทดสอบการโต้ตอบ (การคลิก, การกด Esc)
เพราะยังไม่ได้เพิ่ม jsdom และ Testing Library

## 5. ส่วนระบบ (Pattarakorn)

ใช้ Claude Code ใน VS Code เหมือนกัน หัวข้อนี้ครอบคลุมงานถึงเฟส 2 (Database) และจะเพิ่มเมื่อทำเฟส Auth, Server Action และ Dashboard

### 5.1 AI ช่วยทำอะไรบ้าง

| งาน | ส่วนที่ AI ทำ | ส่วนที่คนทำ / ตัดสินใจ |
|---|---|---|
| วิเคราะห์ใบงานและวางแผน | อ่านใบงานและเอกสารบทที่ 1–3 แล้วสรุป requirement, ร่างแผนงาน 12 เฟส และแบ่งงานสองคน | กำหนดขอบเขตงานของแต่ละคน และจัดทำแผนเป็น PDF ส่งให้เพื่อน |
| 0.3–0.5, 1.7 ตั้งค่า Supabase และ Vercel | อธิบายขั้นตอนในหน้าเว็บทีละข้อ และตรวจผลผ่าน GitHub (deployment, URL) | สร้างบัญชีและโปรเจ็ค, ใส่ key เอง, เลือกให้เพื่อนได้แค่ publishable key |
| 1.1–1.3 โครงโปรเจ็ค | สร้าง Next.js + Tailwind, Supabase client ฝั่ง browser/server, `.env.example`, โครงโฟลเดอร์ | ตรวจ diff และสั่ง push เอง |
| กฎทีมใน `AGENTS.md` | เขียนกฎจากสิ่งที่ตกลงกัน: ขอบเขตงาน, branch และ commit, ความปลอดภัยของ key, การอัปเดต `docs/NOTES.md`, ชื่อและ description ของ PR | กำหนดกฎทุกข้อ เช่น ห้ามระบุ AI ใน commit และต้องอัปเดตโน้ตทีมตลอด |
| รีวิว Pull Request ของเพื่อน | อ่าน diff, รัน lint / tsc / test / build ในเครื่อง, เทียบกับกฎใน `AGENTS.md` และสรุปผล | ตัดสินใจ approve, ขอให้แก้ หรือเปิด issue ไว้แก้ทีหลัง |
| 2.1–2.4 ตาราง Database | เขียน migration ของ `profiles`, `machines`, `alarms`, `maintenance_records` พร้อม constraint ตาม business rule | รัน SQL ใน Supabase SQL Editor ทีละไฟล์, สร้าง user และตั้ง Admin คนแรก |
| 2.5 RLS และสิทธิ์ | เขียน RLS policy ทุกตารางตาม Permission Matrix และ trigger ที่บังคับกฎการแก้ Alarm | รันและทดสอบด้วยบัญชี Technician และ Admin |
| 2.6 TypeScript types | สร้าง `types/database.ts` จาก Database จริงด้วย Supabase CLI และผูกกับ client | login Supabase CLI เอง |

สิ่งที่ **ไม่ได้** ให้ AI ทำ: สร้างบัญชีและ key, ใส่ค่าใน `.env.local` และ Vercel, รัน SQL บน Database จริง, ตั้ง Role ของผู้ใช้
AI ไม่เคยเห็นค่า secret key เพราะไม่ได้ส่ง key ในแชท

### 5.2 ตรวจสอบผลอย่างไร

| วิธีตรวจ | ทำอย่างไร |
|---|---|
| ทดสอบ constraint ใน SQL Editor | ใส่ข้อมูลผิดโดยตั้งใจแล้วต้องได้ error: Machine ID `m-1` ผิดรูปแบบ, ปิด Alarm โดยไม่มี Cause, อ้าง Alarm ของเครื่องอื่นใน Maintenance |
| ทดสอบ RLS ด้วย role จริง | จำลอง session ของ Technician แล้วเพิ่ม Machine ต้องถูกปฏิเสธ (`42501`) จำลอง Admin แล้วต้องทำได้ ครอบด้วย `rollback` ไม่ให้ข้อมูลทดสอบค้าง |
| ตรวจ trigger สร้าง profile | สร้าง user ใหม่ใน Supabase แล้วดูว่ามี profile role `technician` เกิดขึ้นอัตโนมัติ |
| Types จาก Database จริง | ใช้ Supabase CLI สร้าง types แทนการเขียนเอง จึงตรงกับ schema จริงแน่นอน |
| ตรวจอัตโนมัติและ CI | lint, tsc, test, build ในเครื่อง และ GitHub Actions บนทุก PR |
| ตรวจ Deploy | เช็คผ่าน GitHub API ว่า Production deployment มาจาก `main` และเปิด URL ได้จริง |

### 5.3 ปัญหาที่พบและบทเรียน

| ปัญหา | เกิดอะไรขึ้น | แก้อย่างไร | บทเรียน |
|---|---|---|---|
| **AI เปิด PR เองโดยไม่ได้สั่ง** | หลังทำเฟส 2 เสร็จ AI push และเปิด PR #6 ทันที ขณะที่ยังต้องการเพิ่มกฎในไฟล์เดียวกัน | เพิ่ม commit เข้า PR เดิม และสั่งให้ AI ถามก่อน push หรือเปิด PR ทุกครั้ง | งานที่คนอื่นเห็น (push, PR) ให้คนเป็นคนสั่ง |
| **บอกเมนูในเว็บผิด** | AI บอกให้หา Production Branch ในเมนู Git ของ Vercel แต่ Vercel เวอร์ชันปัจจุบันย้ายไปอยู่ที่ Environments | หาเองแล้วส่งภาพหน้าจอให้ AI ยืนยัน | คู่มือจาก AI อาจไม่ตรงกับหน้าเว็บเวอร์ชันล่าสุด ต้องดูหน้าจอจริงประกอบ |
| **Production deploy ผิด branch** | ตอนสร้างโปรเจ็คใน Vercel ยังไม่ได้ deploy จึงเอา branch ของเพื่อนเป็น Production | AI ตรวจพบจากข้อมูล deployment ใน GitHub แล้วให้ deploy จาก `main` ใหม่ | ตรวจผลหลังตั้งค่าทุกครั้ง ไม่ใช่แค่ดูว่าขึ้น Ready |
| **แผนงานขัดกับ requirement** | ข้อความ error ของ Machine ID ซ้ำในแผนงานที่ AI ร่างเป็นภาษาอังกฤษ แต่ requirement กำหนดภาษาไทย | เพื่อนพบตอนเขียน test checklist แล้วตัดสินใจใช้ภาษาไทย | เอกสารที่ AI ร่างต้องเทียบกับ requirement อีกรอบ |
| **ไฟล์ตั้งค่าที่ไม่ควรเข้า repo** | `.gitignore` ที่ได้จาก create-next-app บล็อก `.env.example` ด้วย และ Supabase CLI สร้างโฟลเดอร์ cache | แก้ `.gitignore` ให้ commit `.env.example` ได้ และเพิ่ม `supabase/.temp/` | ตรวจ `git status` ก่อน commit เสมอ ว่ามีไฟล์แปลกปนมาไหม |

## 6. บันทึกเพิ่มเติมระหว่างพัฒนา

เพิ่มแถวใหม่ทุกครั้งที่ใช้ AI กับงานสำคัญ จะได้ไม่ต้องย้อนนึกตอนท้ายโปรเจ็ค

| วันที่ | งาน | AI ทำอะไร | ตรวจอย่างไร | ปัญหาที่พบ |
|---|---|---|---|---|
| | | | | |
