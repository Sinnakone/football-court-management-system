# 📋 Tài liệu API - Hệ thống Quản lý Sân Bóng PTIT

Base URL: `http://localhost:3000`

---

## 🔐 Xác thực (Authentication)

Các route cần đăng nhập phải gửi token trong header:
```
Authorization: Bearer <token>
```

---

## 1. AUTH - Tài khoản

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/dang-ky` | Không | Đăng ký tài khoản |
| POST | `/api/auth/dang-nhap` | Không | Đăng nhập |
| GET | `/api/auth/toi` | Có | Lấy thông tin cá nhân |
| PUT | `/api/auth/cap-nhat` | Có | Cập nhật thông tin |
| PUT | `/api/auth/doi-mat-khau` | Có | Đổi mật khẩu |

### POST /api/auth/dang-ky
**Body:**
```json
{
  "ho_ten": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "mat_khau": "123456",
  "so_dien_thoai": "0912345678"
}
```
**Response 201:**
```json
{
  "success": true,
  "message": "Đăng ký thành công!",
  "token": "eyJhbGci...",
  "user": { "id": 1, "ho_ten": "Nguyễn Văn A", "vai_tro": "khach_hang" }
}
```

### POST /api/auth/dang-nhap
**Body:**
```json
{ "email": "admin@sanbong.vn", "mat_khau": "password" }
```

---

## 2. SÂN BÓNG

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/san` | Không | Danh sách sân đang hoạt động |
| GET | `/api/san/:id` | Không | Chi tiết một sân |
| GET | `/api/san/:id/lich-trong?ngay=YYYY-MM-DD` | Không | Lịch trống theo ngày |
| GET | `/api/san/admin/tat-ca` | Admin | Tất cả sân (kể cả bảo trì) |
| POST | `/api/san` | Admin | Thêm sân mới |
| PUT | `/api/san/:id` | Admin | Cập nhật sân |
| PATCH | `/api/san/:id/trang-thai` | Admin | Đổi trạng thái sân |

### GET /api/san?loai=5 nguoi&gia_max=300000
**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "ten_san": "Sân A1", "loai_san": "5 nguoi", "gia_thue": 200000, ... }
  ],
  "total": 2
}
```

### POST /api/san (Admin)
**Body:**
```json
{
  "ten_san": "Sân E1 mới",
  "loai_san": "7 nguoi",
  "gia_thue": 300000,
  "mo_ta": "Sân mới khai trương"
}
```

---

## 3. ĐẶT SÂN

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/dat-san` | KH | Đặt sân |
| GET | `/api/dat-san/cua-toi` | KH | Lịch sử đặt của tôi |
| GET | `/api/dat-san/:id` | KH/Admin | Chi tiết đơn |
| PUT | `/api/dat-san/:id/huy` | KH | Hủy đơn |
| GET | `/api/dat-san/admin/tat-ca` | Admin | Tất cả đơn |
| PATCH | `/api/dat-san/admin/:id/trang-thai` | Admin | Cập nhật trạng thái đơn |

### POST /api/dat-san
**Body:**
```json
{
  "san_id": 1,
  "ngay_dat": "2024-12-25",
  "gio_bat_dau": "08:00",
  "gio_ket_thuc": "10:00",
  "ghi_chu": "Mang đồ ăn theo"
}
```
**Response 201:**
```json
{
  "success": true,
  "message": "Đặt sân thành công! Vui lòng chờ Admin xác nhận.",
  "data": {
    "id": 10,
    "ten_san": "Sân A1",
    "so_gio": 2,
    "tong_tien": 400000,
    "trang_thai": "cho_xac_nhan"
  }
}
```

### PATCH /api/dat-san/admin/:id/trang-thai (Admin)
**Body:**
```json
{ "trang_thai": "da_xac_nhan" }
```
Các giá trị: `cho_xac_nhan` | `da_xac_nhan` | `da_huy` | `hoan_thanh`

---

## 4. THANH TOÁN

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/thanh-toan` | KH | Tạo thanh toán |
| GET | `/api/thanh-toan/don/:dat_san_id` | KH | Xem TT theo đơn |

### POST /api/thanh-toan
**Body:**
```json
{
  "dat_san_id": 10,
  "phuong_thuc": "chuyen_khoan",
  "ghi_chu": "Chuyển khoản ngân hàng"
}
```
Phương thức: `tien_mat` | `chuyen_khoan` | `vi_dien_tu`

---

## 5. ADMIN

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/admin/dashboard` | Admin | Thống kê tổng quan |
| GET | `/api/admin/bao-cao/doanh-thu` | Admin | Báo cáo doanh thu |
| GET | `/api/admin/nguoi-dung` | Admin | Danh sách người dùng |
| PATCH | `/api/admin/nguoi-dung/:id/trang-thai` | Admin | Khóa/mở tài khoản |

### GET /api/admin/bao-cao/doanh-thu?tu_ngay=2024-01-01&den_ngay=2024-12-31&loai=thang
**Response:**
```json
{
  "success": true,
  "data": {
    "tong_quan": {
      "tong_don": 50,
      "tong_doanh_thu": 25000000,
      "don_hoan_thanh": 40,
      "don_da_huy": 5,
      "don_cho_duyet": 5
    },
    "chi_tiet": [
      { "ky": "2024-01", "so_don": 12, "doanh_thu": 5400000 }
    ],
    "top_san": [
      { "ten_san": "Sân A1", "so_lan_dat": 20, "doanh_thu": 8000000 }
    ]
  }
}
```

---

## ❌ Mã lỗi thường gặp

| Code | Ý nghĩa |
|------|---------|
| 400 | Dữ liệu đầu vào không hợp lệ |
| 401 | Chưa đăng nhập hoặc token hết hạn |
| 403 | Không có quyền thực hiện |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột dữ liệu (email trùng, sân đã đặt...) |
| 500 | Lỗi máy chủ |

---

## 🧪 Tài khoản test mẫu

| Vai trò | Email | Mật khẩu |
|---------|-------|---------|
| Admin | admin@sanbong.vn | password |
| Khách hàng | nguyenvanan@gmail.com | password |
