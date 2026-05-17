// routes/thanhToan.js
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { taoThanhToan, layThanhToanTheoDon } = require('../controllers/thanhToanController');

router.post('/',                         authMiddleware, taoThanhToan);
router.get('/don/:dat_san_id',           authMiddleware, layThanhToanTheoDon);

module.exports = router;
