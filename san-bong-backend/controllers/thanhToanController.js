// controllers/thanhToanController.js
// Xử lý nghiệp vụ: tạo thanh toán, xem thanh toán

const db = require('../config/database');

// ─── Tạo thanh toán cho một đơn đặt sân ──────────────────────────────────────
// POST /api/thanh-toan
// Body: { dat_san_id, phuong_thuc, ghi_chu }
const taoThanhToan = async (req, res) => {
    try {
        const { dat_san_id, phuong_thuc, ghi_chu } = req.body;

        if (!dat_san_id || !phuong_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã đơn đặt sân và phương thức thanh toán.',
            });
        }

        const validPT = ['tien_mat', 'chuyen_khoan', 'vi_dien_tu'];
        if (!validPT.includes(phuong_thuc)) {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ.',
            });
        }

        // Kiểm tra đơn đặt sân tồn tại và thuộc về user này
        const [don] = await db.execute(
            'SELECT * FROM dat_san WHERE id = ? AND user_id = ?',
            [dat_san_id, req.user.id]
        );
        if (don.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt sân.' });
        }
        if (don[0].trang_thai === 'da_huy') {
            return res.status(400).json({ success: false, message: 'Đơn đã bị hủy, không thể thanh toán.' });
        }

        // Kiểm tra đã có thanh toán chưa
        const [existing] = await db.execute(
            "SELECT id FROM thanh_toan WHERE dat_san_id = ? AND trang_thai = 'da_thanh_toan'",
            [dat_san_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Đơn này đã được thanh toán rồi.' });
        }

        // Tạo mã giao dịch
        const ma_giao_dich = 'SB' + Date.now() + Math.floor(Math.random() * 1000);

        // Thanh toán tiền mặt → trạng thái "chờ thanh toán" (sẽ xác nhận tại sân)
        // Chuyển khoản / Ví → giả lập thành công ngay
        const trang_thai    = phuong_thuc === 'tien_mat' ? 'cho_thanh_toan' : 'da_thanh_toan';
        const ngay_tt       = phuong_thuc === 'tien_mat' ? null : new Date();

        const [result] = await db.execute(
            `INSERT INTO thanh_toan
             (dat_san_id, so_tien, phuong_thuc, trang_thai, ma_giao_dich, ngay_thanh_toan, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             RETURNING id`,
            [dat_san_id, don[0].tong_tien, phuong_thuc, trang_thai, ma_giao_dich, ngay_tt, ghi_chu || null]
        );

        // Nếu đã thanh toán → cập nhật trạng thái đơn
        if (trang_thai === 'da_thanh_toan') {
            await db.execute(
                "UPDATE dat_san SET trang_thai = 'da_xac_nhan' WHERE id = ?",
                [dat_san_id]
            );
        }

        const msg = phuong_thuc === 'tien_mat'
            ? 'Đặt sân thành công! Vui lòng thanh toán tiền mặt khi đến sân.'
            : `Thanh toán thành công! Mã giao dịch: ${ma_giao_dich}`;

        return res.status(201).json({
            success: true,
            message: msg,
            data: {
                id:            result.insertId,
                ma_giao_dich,
                so_tien:       don[0].tong_tien,
                phuong_thuc,
                trang_thai,
            },
        });
    } catch (err) {
        console.error('Lỗi tạo thanh toán:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Lấy thông tin thanh toán của một đơn ────────────────────────────────────
// GET /api/thanh-toan/don/:dat_san_id
const layThanhToanTheoDon = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT tt.*, ds.ngay_dat, ds.gio_bat_dau, ds.gio_ket_thuc, sb.ten_san
             FROM thanh_toan tt
             JOIN dat_san ds ON tt.dat_san_id = ds.id
             JOIN san_bong sb ON ds.san_id = sb.id
             WHERE tt.dat_san_id = ?`,
            [req.params.dat_san_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Chưa có thông tin thanh toán cho đơn này.' });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Lỗi lấy thanh toán:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

module.exports = { taoThanhToan, layThanhToanTheoDon };
