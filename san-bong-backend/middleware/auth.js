// middleware/auth.js
// Middleware xác thực JWT token
// Sử dụng: thêm vào route cần bảo vệ → router.get('/...', authMiddleware, handler)

const jwt = require('jsonwebtoken');
require('dotenv').config();

// ─── Middleware: xác thực token (bắt buộc đăng nhập) ────────────────────────
const authMiddleware = (req, res, next) => {
    // Lấy token từ header "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;  // gắn thông tin user vào request
        next();
    } catch (err) {
        let message = 'Token không hợp lệ.';
        if (err.name === 'TokenExpiredError') message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        return res.status(401).json({ success: false, message });
    }
};

// ─── Middleware: chỉ Admin mới được truy cập ─────────────────────────────────
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.vai_tro !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thực hiện thao tác này.',
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };
