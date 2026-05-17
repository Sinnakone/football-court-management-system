// controllers/authController.js
// Xử lý nghiệp vụ: đăng ký, đăng nhập, lấy thông tin cá nhân, đổi mật khẩu

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/database');
require('dotenv').config();

// ─── Helper: tạo JWT token ───────────────────────────────────────────────────
const taoToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, vai_tro: user.vai_tro },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// ─── Đăng ký tài khoản ───────────────────────────────────────────────────────
// POST /api/auth/dang-ky
// Body: { ho_ten, email, mat_khau, so_dien_thoai }
const dangKy = async (req, res) => {
    try {
        const { ho_ten, email, mat_khau, so_dien_thoai } = req.body;

        // 1. Validate dữ liệu đầu vào
        if (!ho_ten || !email || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, email, mật khẩu).',
            });
        }
        if (mat_khau.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự.',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ.',
            });
        }

        // 2. Kiểm tra email đã tồn tại
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email này đã được sử dụng. Vui lòng dùng email khác.',
            });
        }

        // 3. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(mat_khau, 10);

        // 4. Lưu vào database
        const [result] = await db.execute(
            `INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, vai_tro)
             VALUES (?, ?, ?, ?, 'khach_hang')
             RETURNING id`,
            [ho_ten.trim(), email.toLowerCase().trim(), hashedPassword, so_dien_thoai || null]
        );

        // 5. Tạo token luôn (tự động đăng nhập sau khi đăng ký)
        const newUser = { id: result.insertId, email: email.toLowerCase(), vai_tro: 'khach_hang' };
        const token   = taoToken(newUser);

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Chào mừng bạn đến với hệ thống.',
            token,
            user: {
                id:            result.insertId,
                ho_ten:        ho_ten.trim(),
                email:         email.toLowerCase().trim(),
                so_dien_thoai: so_dien_thoai || null,
                vai_tro:       'khach_hang',
            },
        });
    } catch (err) {
        console.error('Lỗi đăng ký:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ. Vui lòng thử lại.' });
    }
};

// ─── Đăng nhập ───────────────────────────────────────────────────────────────
// POST /api/auth/dang-nhap
// Body: { email, mat_khau }
const dangNhap = async (req, res) => {
    try {
        const { email, mat_khau } = req.body;

        if (!email || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu.',
            });
        }

        // 1. Tìm user theo email
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng.',
            });
        }

        const user = users[0];

        // 2. Kiểm tra tài khoản bị khóa
        if (user.trang_thai === 'bi_khoa') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
            });
        }

        // 3. So sánh mật khẩu
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng.',
            });
        }

        // 4. Tạo JWT token
        const token = taoToken(user);

        return res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id:            user.id,
                ho_ten:        user.ho_ten,
                email:         user.email,
                so_dien_thoai: user.so_dien_thoai,
                vai_tro:       user.vai_tro,
            },
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ. Vui lòng thử lại.' });
    }
};

// ─── Lấy thông tin cá nhân ───────────────────────────────────────────────────
// GET /api/auth/toi  (cần token)
const layThongTinToi = async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, ho_ten, email, so_dien_thoai, vai_tro, trang_thai, ngay_tao FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }
        return res.json({ success: true, data: users[0] });
    } catch (err) {
        console.error('Lỗi lấy thông tin:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Cập nhật thông tin cá nhân ──────────────────────────────────────────────
// PUT /api/auth/cap-nhat  (cần token)
// Body: { ho_ten, so_dien_thoai }
const capNhatThongTin = async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai } = req.body;

        if (!ho_ten) {
            return res.status(400).json({ success: false, message: 'Họ tên không được để trống.' });
        }

        await db.execute(
            'UPDATE users SET ho_ten = ?, so_dien_thoai = ? WHERE id = ?',
            [ho_ten.trim(), so_dien_thoai || null, req.user.id]
        );

        return res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
    } catch (err) {
        console.error('Lỗi cập nhật:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Đổi mật khẩu ────────────────────────────────────────────────────────────
// PUT /api/auth/doi-mat-khau  (cần token)
// Body: { mat_khau_cu, mat_khau_moi }
const doiMatKhau = async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi } = req.body;

        if (!mat_khau_cu || !mat_khau_moi) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' });
        }
        if (mat_khau_moi.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }

        // Lấy mật khẩu hiện tại
        const [users] = await db.execute('SELECT mat_khau FROM users WHERE id = ?', [req.user.id]);
        const isMatch = await bcrypt.compare(mat_khau_cu, users[0].mat_khau);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng.' });
        }

        const newHashed = await bcrypt.hash(mat_khau_moi, 10);
        await db.execute('UPDATE users SET mat_khau = ? WHERE id = ?', [newHashed, req.user.id]);

        return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error('Lỗi đổi mật khẩu:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

module.exports = { dangKy, dangNhap, layThongTinToi, capNhatThongTin, doiMatKhau };
