# 🏟️ Hệ thống Quản lý Sân Bóng - Backend API
**Môn: Thực tập cơ sở | PTIT**

---

## 📁 Cấu trúc thư mục

```
san-bong-backend/
├── server.js                   ← Entry point, khởi động server
├── .env                        ← Biến môi trường (DB, JWT secret)
├── package.json
├── database.sql                ← Script tạo CSDL và dữ liệu mẫu
├── API_DOCS.md                 ← Tài liệu API đầy đủ
│
├── config/
│   └── database.js             ← Kết nối PostgreSQL
│
├── middleware/
│   └── auth.js                 ← Xác thực JWT, phân quyền Admin
│
├── controllers/                ← Xử lý nghiệp vụ (logic chính)
│   ├── authController.js       ← Đăng ký, đăng nhập, đổi mật khẩu
│   ├── sanController.js        ← CRUD sân bóng, kiểm tra lịch trống
│   ├── datSanController.js     ← Đặt sân, hủy sân, xem lịch sử
│   ├── thanhToanController.js  ← Thanh toán
│   └── adminController.js      ← Báo cáo, quản lý người dùng
│
└── routes/                     ← Định nghĩa endpoint URL
    ├── auth.js
    ├── san.js
    ├── datSan.js
    ├── thanhToan.js
    └── admin.js
```

---

## 🚀 Cách cài đặt và chạy

### Bước 1: Cài đặt Node.js
Tải tại: https://nodejs.org (chọn LTS)

### Bước 2: Chạy PostgreSQL bằng Podman Compose
```bash
podman-compose up -d postgres
```

Thông tin kết nối mặc định:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quan_ly_san_bong
```

Kiểm tra dữ liệu:
```bash
podman-compose exec -T postgres psql -U postgres -d quan_ly_san_bong -c "SELECT id, ho_ten FROM users ORDER BY id;"
```

Chạy migrate lại từ `database.sql`:
```bash
./migrate-db.sh
```

Nếu đã tạo volume trước đó và muốn chạy lại `database.sql` từ đầu:
```bash
podman-compose down -v
podman-compose up -d postgres
```

### Bước 3: Cài các thư viện
```bash
cd san-bong-backend
npm install
```

### Bước 4: Cấu hình .env (nếu cần)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quan_ly_san_bong
JWT_SECRET=sanbong_ptit_secret_2024
```

### Bước 5: Chạy server
```bash
# Chế độ thường
node server.js

# Chế độ dev (tự restart khi sửa code)
npm run dev
```

Kết quả thành công:
```
══════════════════════════════════════════════════
  🏟️  Hệ thống Quản lý Sân Bóng - PTIT
  🚀  Server: http://localhost:3000
  📋  API:    http://localhost:3000/api
══════════════════════════════════════════════════
✅ Kết nối database thành công!
```

---

## 🧪 Test API với Postman / Thunder Client

### 1. Đăng nhập Admin
```
POST http://localhost:3000/api/auth/dang-nhap
Body: { "email": "admin@sanbong.vn", "mat_khau": "password" }
```
→ Copy token từ response

### 2. Xem danh sách sân
```
GET http://localhost:3000/api/san
```

### 3. Đặt sân (cần token)
```
POST http://localhost:3000/api/dat-san
Header: Authorization: Bearer <token>
Body: {
  "san_id": 1,
  "ngay_dat": "2024-12-30",
  "gio_bat_dau": "08:00",
  "gio_ket_thuc": "10:00"
}
```

### 4. Xem dashboard Admin
```
GET http://localhost:3000/api/admin/dashboard
Header: Authorization: Bearer <token_admin>
```

---

## 👥 Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---------|-------|---------|
| Admin | admin@sanbong.vn | password |
| Khách hàng | nguyenvanan@gmail.com | password |

*Lưu ý: mật khẩu trong database.sql đã được hash. Nếu muốn thay đổi, dùng bcryptjs để hash lại.*
