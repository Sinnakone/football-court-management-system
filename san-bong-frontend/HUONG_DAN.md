# 🏟️ Hệ thống Quản lý Sân Bóng — PTIT
## Hướng dẫn cài đặt & chạy toàn bộ dự án

---

## 📁 Cấu trúc dự án

```
quan-ly-san-bong/
├── san-bong-backend/        ← Node.js + Express API
│   ├── server.js
│   ├── database.sql         ← Tạo CSDL tại đây
│   ├── .env
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   └── routes/
│
└── san-bong-frontend/       ← Giao diện HTML/CSS/JS
    ├── index.html           ← Trang chủ
    ├── css/style.css
    ├── js/
    │   ├── api.js           ← Gọi API tập trung
    │   ├── utils.js         ← Toast, format, helpers
    │   └── components.js    ← Navbar, footer
    └── pages/
        ├── login.html       ← Đăng nhập / Đăng ký
        ├── san-bong.html    ← Danh sách sân + filter
        ├── dat-san.html     ← Đặt sân (slot picker)
        ├── lich-su.html     ← Lịch sử đặt sân
        └── admin/
            ├── dashboard.html    ← Tổng quan Admin
            ├── don-dat-san.html  ← Quản lý đơn
            ├── san-bong.html     ← Quản lý sân
            ├── nguoi-dung.html   ← Quản lý user
            └── bao-cao.html      ← Báo cáo doanh thu
```

---

## 🚀 Chạy dự án (5 bước)

### Bước 1 — Cài XAMPP, khởi động MySQL
- Tải: https://www.apachefriends.org
- Mở XAMPP Control Panel → nhấn **Start** ở MySQL

### Bước 2 — Import database
Mở **phpMyAdmin** tại http://localhost/phpmyadmin
→ Chọn **Import** → chọn file `san-bong-backend/database.sql` → Go

### Bước 3 — Cài Node.js (nếu chưa có)
Tải tại: https://nodejs.org → chọn LTS

### Bước 4 — Chạy Backend
```bash
cd san-bong-backend
npm install
node server.js
```
Thấy thông báo:
```
✅ Kết nối database thành công!
🚀 Server: http://localhost:3000
```
là thành công.

### Bước 5 — Mở Frontend
**Cách 1 (VS Code):** Cài extension **Live Server** → click chuột phải vào `index.html` → *Open with Live Server*

**Cách 2 (terminal):**
```bash
cd san-bong-frontend
npx serve .
```
→ Mở http://localhost:3000 (hoặc port Live Server báo)

---

## 👥 Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@sanbong.vn | password |
| Khách hàng 1 | nguyenvanan@gmail.com | password |
| Khách hàng 2 | tranthibibinh@gmail.com | password |

> ⚠️ Mật khẩu trong `database.sql` đã được hash sẵn.  
> Nếu muốn đổi mật khẩu, hãy dùng bcryptjs để hash lại.

---

## 🗺️ Luồng sử dụng chính

### Khách hàng
```
Trang chủ → Xem sân bóng → Đặt sân (chọn ngày/giờ) → Thanh toán → Lịch sử đặt
```

### Admin
```
Dashboard → Quản lý đơn (xác nhận/từ chối) → Quản lý sân → Báo cáo doanh thu
```

---

## 🔌 Danh sách API Endpoints

| Method | URL | Mô tả |
|--------|-----|-------|
| POST | /api/auth/dang-ky | Đăng ký |
| POST | /api/auth/dang-nhap | Đăng nhập |
| GET  | /api/san | Danh sách sân |
| GET  | /api/san/:id/lich-trong?ngay= | Lịch trống |
| POST | /api/dat-san | Đặt sân |
| GET  | /api/dat-san/cua-toi | Lịch sử của tôi |
| PUT  | /api/dat-san/:id/huy | Hủy đặt sân |
| GET  | /api/admin/dashboard | Dashboard Admin |
| GET  | /api/admin/bao-cao/doanh-thu | Báo cáo doanh thu |

Xem đầy đủ tại: `san-bong-backend/API_DOCS.md`

---

## ❓ Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|------------|---------|
| "Lỗi kết nối database" | MySQL chưa chạy | Mở XAMPP → Start MySQL |
| "Cannot GET /api/san" | Backend chưa chạy | Chạy `node server.js` |
| CORS error | API URL sai | Kiểm tra `API_BASE` trong `js/api.js` |
| 401 Unauthorized | Chưa đăng nhập | Đăng nhập và thử lại |

---

*Dự án thực tập cơ sở — PTIT · Node.js + MySQL + HTML/CSS/JS*
