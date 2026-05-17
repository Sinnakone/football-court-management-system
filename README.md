# Quản Lý Sân Bóng

This is **Intern's project**, built with help from Alex and Me.

## Overview

A football field management system with three components:

- `san-bong-backend/` — Backend API
- `san-bong-frontend/` — Customer-facing frontend
- `san-bong-admin/` — Admin dashboard

## Cài đặt và Chạy (Installation and Running)

Thực hiện theo các bước sau để thiết lập môi trường và khởi chạy hệ thống:

### 1. Cài đặt các công cụ cần thiết (Prerequisites)
*   **Docker Desktop & Docker Compose**: Tải và cài đặt từ [Docker Official Site](https://www.docker.com/products/docker-desktop/). Đảm bảo Docker đang chạy.
*   **Node.js**: Cài đặt phiên bản LTS từ [nodejs.org](https://nodejs.org/).

### 2. Thiết lập Cơ sở dữ liệu (Database Setup)
Di chuyển vào thư mục backend và khởi chạy Docker container:
```bash
cd san-bong-backend
docker compose up -d
```

Sau khi container đã chạy, thực hiện migration để khởi tạo/cập nhật dữ liệu (Yêu cầu Git Bash hoặc môi trường shell tương đương trên Windows):
```bash
bash migrate-db.sh
```

### 3. Cài đặt Dependencies (Install Dependencies)
Bạn cần cài đặt các thư viện cần thiết cho cả ba thành phần:

```bash
# Cài đặt cho Backend
cd san-bong-backend
npm install

# Cài đặt cho Frontend
cd ../san-bong-frontend
npm install

# Cài đặt cho Admin
cd ../san-bong-admin
npm install
```

### 4. Khởi chạy toàn bộ hệ thống (Run All)
Quay lại thư mục gốc của dự án và chạy file script sau để khởi động tất cả các dịch vụ:
```bash
cd ..
run-all.bat
```

## Running (Individual Scripts)

Nếu bạn muốn chạy riêng lẻ từng phần (sau khi đã thực hiện các bước cài đặt trên):

- `run-all.bat` — Start everything
- `run-backend.bat` — Start backend only
- `run-frontend.bat` — Start frontend only
- `run-admin.bat` — Start admin only

## Credits

- **Project owner:** Addy
- **Design:** Alex
