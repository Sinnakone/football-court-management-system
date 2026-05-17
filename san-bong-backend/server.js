// server.js
// Entry point - Khởi động Express server

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ─── Middleware toàn cục ──────────────────────────────────────────────────────
app.use(cors({
    origin:  '*',        // Cho phép tất cả origin (dev). Production: đổi thành domain cụ thể
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const path = require('path');

// Cấu hình để Express phục vụ các file tĩnh nằm ở thư mục cha
// (Vì server.js nằm trong san-bong-backend, còn giao diện nằm ở thư mục gốc)


app.use(express.static(path.join(__dirname, '../')));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/san',         require('./routes/san'));
app.use('/api/dat-san',     require('./routes/datSan'));
app.use('/api/thanh-toan',  require('./routes/thanhToan'));
app.use('/api/admin',       require('./routes/admin'));

// ─── Route kiểm tra server ────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Quản lý Sân Bóng đang chạy!',
        version: '1.0.0',
        endpoints: {
            auth:       '/api/auth',
            san:        '/api/san',
            dat_san:    '/api/dat-san',
            thanh_toan: '/api/thanh-toan',
            admin:      '/api/admin',
        },
    });
});

// ─── Xử lý route không tồn tại ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ─── Xử lý lỗi toàn cục ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Lỗi không xử lý được:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
});

// ─── Khởi động server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('');
    console.log('Hệ thống Quản lý Sân Bóng');
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API:    http://localhost:${PORT}/api`);
    console.log('');
});
