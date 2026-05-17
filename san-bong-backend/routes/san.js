// routes/san.js
const express = require('express');
const router  = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
    layDanhSachSan,
    laySanTheoId,
    kiemTraLichTrong,
    layLichTatCaSanTheoNgay,
    layTatCaSan,
    themSan,
    capNhatSan,
    doiTrangThaiSan,
} = require('../controllers/sanController');

// Admin routes must be registered before "/:id" routes.
router.get('/admin/tat-ca',              authMiddleware, adminMiddleware, layTatCaSan);
router.post('/',                         authMiddleware, adminMiddleware, themSan);
router.put('/:id',                       authMiddleware, adminMiddleware, capNhatSan);
router.patch('/:id/trang-thai',          authMiddleware, adminMiddleware, doiTrangThaiSan);

// Public routes
router.get('/',              layDanhSachSan);
router.get('/lich-theo-ngay', layLichTatCaSanTheoNgay);
router.get('/:id/lich-trong', kiemTraLichTrong);
router.get('/:id',           laySanTheoId);

module.exports = router;
