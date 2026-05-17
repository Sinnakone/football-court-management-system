#!/bin/bash

# ============================================================
#  HỆ THỐNG QUẢN LÝ SÂN BÓNG - PTIT
#  Script: migrate-db.sh
#  Mô tả: Chạy file database.sql để khởi tạo/cập nhật CSDL
# ============================================================

# Tên container được định nghĩa trong compose.yaml
CONTAINER_NAME="san-bong-postgres"
SQL_FILE="database.sql"

echo "--- Bắt đầu quá trình Migration ---"

# 1. Kiểm tra xem Docker container có đang chạy không
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "LỖI: Container '${CONTAINER_NAME}' không hoạt động."
    echo "Vui lòng chạy 'docker compose up -d' để khởi động hệ thống."
    exit 1
fi

# 2. Kiểm tra file SQL cục bộ
if [ ! -f "$SQL_FILE" ]; then
    echo "LỖI: Không tìm thấy file $SQL_FILE."
    exit 1
fi

echo "Đang áp dụng cấu trúc CSDL từ $SQL_FILE vào container $CONTAINER_NAME..."

# 3. Thực thi file SQL
# database.sql đã bao gồm logic tạo DB và kết nối (\connect)
docker exec -i "$CONTAINER_NAME" psql -U postgres -d postgres < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "--- Migration hoàn tất thành công! ---"
else
    echo "--- Migration thất bại! Vui lòng kiểm tra lỗi bên trên. ---"
    exit 1
fi
