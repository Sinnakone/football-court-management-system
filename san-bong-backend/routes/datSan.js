// routes/datSan.js
const express = require('express');
const router  = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
    datSan,
    layLichSuCuaToi,
    layChiTietDon,
    huySan,
    adminLayTatCaDon,
    adminCapNhatTrangThai,
} = require('../controllers/datSanController');

// Admin routes must be registered before "/:id" routes.
router.get('/admin/tat-ca',              authMiddleware, adminMiddleware, adminLayTatCaDon);
router.patch('/admin/:id/trang-thai',    authMiddleware, adminMiddleware, adminCapNhatTrangThai);

// Khách hàng routes (cần đăng nhập)
router.post('/',              authMiddleware, datSan);
router.get('/cua-toi',        authMiddleware, layLichSuCuaToi);
router.put('/:id/huy',        authMiddleware, huySan);
router.get('/:id',            authMiddleware, layChiTietDon);

module.exports = router;
