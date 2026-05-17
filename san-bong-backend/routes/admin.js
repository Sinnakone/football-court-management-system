// routes/admin.js
const express = require('express');
const router  = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
    baoCaoDoanhThu,
    dashboard,
    layDanhSachNguoiDung,
    doiTrangThaiNguoiDung,
} = require('../controllers/adminController');

// Tất cả route admin đều cần authMiddleware + adminMiddleware
router.use(authMiddleware, adminMiddleware);

router.get('/dashboard',                   dashboard);
router.get('/bao-cao/doanh-thu',           baoCaoDoanhThu);
router.get('/nguoi-dung',                  layDanhSachNguoiDung);
router.patch('/nguoi-dung/:id/trang-thai', doiTrangThaiNguoiDung);

module.exports = router;
