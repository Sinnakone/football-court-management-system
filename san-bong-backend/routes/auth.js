// routes/auth.js
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    dangKy,
    dangNhap,
    layThongTinToi,
    capNhatThongTin,
    doiMatKhau,
} = require('../controllers/authController');

// Public routes
router.post('/dang-ky',   dangKy);
router.post('/dang-nhap', dangNhap);

// Protected routes (cần đăng nhập)
router.get('/toi',            authMiddleware, layThongTinToi);
router.put('/cap-nhat',       authMiddleware, capNhatThongTin);
router.put('/doi-mat-khau',   authMiddleware, doiMatKhau);

module.exports = router;
