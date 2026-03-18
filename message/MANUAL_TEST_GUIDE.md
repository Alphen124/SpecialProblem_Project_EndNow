# Manual Test Guide for Edit & Delete Features

## ✅ ทำตามขั้นตอนนี้เพื่อทดสอบฟีเจอร์ใหม่

### 1. เปิดเว็บไซต์
```
http://localhost:3001/rentout.html
```

### 2. Login เข้าระบบ
- ใช้บัญชีที่มีอยู่หรือสร้างใหม่ (ต้องเป็น @kmitl.ac.th)

### 3. ทดสอบฟีเจอร์ Edit Device
#### ขั้นตอน:
1. ที่หน้า Rent Out คุณจะเห็นอุปกรณ์ทั้งหมดของคุณ
2. แต่ละ card จะมีปุ่ม **"Edit"** 
3. คลิก Edit เพื่อแก้ไขชื่อ, ราคา, รายละเอียด
4. กด "Update" เพื่อบันทึก
5. หน้าจะ reload และแสดงข้อมูลใหม่

#### ✅ ทดสอบ Business Rules:
- ✅ สามารถแก้ไขได้เมื่อ status = **Available (1)** หรือ **Returned (3)**
- ❌ **ไม่สามารถแก้ไขได้** เมื่อ status = **Delivered (2)** หรือ **Overdue (4)**
  - ปุ่ม Edit จะถูก disabled และมี tooltip บอก

### 4. ทดสอบฟีเจอร์ Delete Device
#### ขั้นตอน:
1. แต่ละ card จะมีปุ่ม **"Delete"** (สีแดง)
2. คลิก Delete 
3. ระบบจะถามยืนยัน "Are you sure...?"
4. กด OK เพื่อยืนยันการลบ
5. อุปกรณ์จะถูกลบและหายไปจาก list

#### ✅ ทดสอบ Business Rules:
- ✅ สามารถลบได้เมื่อ status = **Available (1)** หรือ **Returned (3)**
- ❌ **ไม่สามารถลบได้** เมื่อ status = **Delivered (2)** หรือ **Overdue (4)**
  - ปุ่ม Delete จะถูก disabled และมี tooltip บอก
  - เหตุผล: อุปกรณ์ที่ส่งไปแล้วหรือเกินกำหนดต้องรอจนกลับมาก่อน

### 5. ทดสอบ Status Update Validation
#### ขั้นตอน:
1. แต่ละ card จะมี dropdown เลือก status
2. ลองเปลี่ยน status:
   - **Available** → **Delivered** ✅ (ได้)
   - **Delivered** → **Returned** ✅ (ได้)
   - **Available** → **Returned** ❌ (ไม่ได้)

#### ✅ ทดสอบ Business Rules:
- ❌ **ไม่สามารถเลือก "Returned"** ได้ ถ้าอุปกรณ์ไม่เคยถูกตั้งเป็น "Delivered" ก่อน
  - Option "Returned" จะถูก disabled และมีข้อความ "(Must be delivered first)"
  - ถ้าบังคับเปลี่ยนผ่าน API จะได้ error message

### 6. ทดสอบ Full Flow
#### Test Case 1: Create → Edit → Delete (Available)
```
1. สร้างอุปกรณ์ใหม่ (status = Available)
2. แก้ไขชื่อและราคา → ✅ สำเร็จ
3. ลบอุปกรณ์ → ✅ สำเร็จ
```

#### Test Case 2: Create → Delivered → Try Edit/Delete
```
1. สร้างอุปกรณ์ใหม่
2. เปลี่ยน status เป็น "Delivered"
3. ลองกดปุ่ม Edit → ❌ ปุ่มถูก disabled
4. ลองกดปุ่ม Delete → ❌ ปุ่มถูก disabled
5. View History → ✅ เห็นประวัติการเปลี่ยน status
```

#### Test Case 3: Create → Delivered → Returned → Delete
```
1. สร้างอุปกรณ์ใหม่
2. เปลี่ยน status เป็น "Delivered"
3. เปลี่ยน status เป็น "Returned"
4. ตอนนี้ Edit และ Delete ใช้ได้แล้ว
5. ลบอุปกรณ์ → ✅ สำเร็จ
```

#### Test Case 4: Try "Returned" without "Delivered"
```
1. สร้างอุปกรณ์ใหม่ (status = Available)
2. พยายามเปลี่ยนเป็น "Returned" โดยตรง
3. ดูที่ dropdown → option "Returned" จะถูก disabled
4. ต้องเปลี่ยนเป็น "Delivered" ก่อน แล้วค่อยเปลี่ยนเป็น "Returned"
```

---

## 📋 Checklist สำหรับ Tester

### Frontend Features:
- [ ] ปุ่ม "Edit" แสดงในทุก device card
- [ ] ปุ่ม "Delete" แสดงในทุก device card (สีแดง)
- [ ] ปุ่ม "History" แสดงประวัติ status changes
- [ ] กด Edit → Modal เปิดพร้อมข้อมูลเก่า
- [ ] แก้ไขและ Save → ข้อมูลอัพเดต
- [ ] กด Delete → Confirm dialog แสดง
- [ ] ยืนยันลบ → อุปกรณ์หายจาก list
- [ ] Status dropdown มี option: Available, Delivered, Returned (disabled?), Overdue
- [ ] กด Update Status → status เปลี่ยนและ badge อัพเดต

### Business Rules:
- [ ] Cannot edit device with status Delivered (2)
- [ ] Cannot edit device with status Overdue (4)
- [ ] Cannot delete device with status Delivered (2)
- [ ] Cannot delete device with status Overdue (4)
- [ ] Cannot select "Returned" if device was never "Delivered"
- [ ] Option "Returned" is disabled in dropdown if never delivered
- [ ] API returns proper error message when trying invalid operations

### Error Handling:
- [ ] Edit ไม่ได้ → แสดง alert ด้วย error message
- [ ] Delete ไม่ได้ → แสดง alert ด้วย error message  
- [ ] Status update ไม่ได้ → แสดง alert ด้วย error message
- [ ] Network error → แสดง alert บอกผู้ใช้

---

## 🐛 Known Issues & Limitations

### ข้อจำกัดปัจจุบัน:
1. ไม่มี image upload ตัวจริง (ใช้ URL แทน)
2. History modal แสดงเฉพาะ status changes
3. Delete เป็น permanent (ไม่มี soft delete)
4. ไม่มี confirmation modal สำหรับ edit (มีแค่ delete)

### ถ้าเจอ Bug:
1. เปิด Developer Console (F12)
2. ดู Network tab สำหรับ API calls
3. ดู Console tab สำหรับ error messages
4. Copy error message และรายงาน

---

## 🔧 Troubleshooting

### ปุ่ม Edit/Delete ไม่แสดง:
```javascript
// เปิด Console และรัน:
loadMyDevices()
```

### Status dropdown ไม่ disable "Returned":
```javascript
// ตรวจสอบ history:
const deviceId = 123; // เปลี่ยนเป็น device ID ที่ต้องการ
fetch(`http://localhost:3001/api/devices/${deviceId}/history`, {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
}).then(r => r.json()).then(console.log)
```

### Server Error:
```bash
# Restart Go server:
cd noteletwebservice-development
go run main.go
```

---

## ✅ Test Results Template

```
[ ] Test Date: __________
[ ] Tester: __________

Frontend Tests:
[ ] Edit Modal Opens
[ ] Edit Updates Data
[ ] Delete Removes Device
[ ] Status Dropdown Works
[ ] History Modal Shows Data

Business Rule Tests:
[ ] Cannot Edit when Delivered
[ ] Cannot Edit when Overdue
[ ] Cannot Delete when Delivered
[ ] Cannot Delete when Overdue
[ ] Cannot Returned without Delivered

Full Flow Tests:
[ ] Test Case 1 (Create→Edit→Delete)
[ ] Test Case 2 (Create→Delivered→Disabled)
[ ] Test Case 3 (Create→Delivered→Returned→Delete)
[ ] Test Case 4 (Returned Restriction)

Notes:
___________________________________
___________________________________
___________________________________
```
