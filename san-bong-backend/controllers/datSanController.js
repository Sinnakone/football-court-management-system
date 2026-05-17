// controllers/datSanController.js
// Xử lý nghiệp vụ: đặt sân, hủy sân, xem lịch sử, Admin quản lý đơn

const db = require('../config/database');

// ─── Helper: tính số giờ giữa 2 mốc thời gian ───────────────────────────────
const tinhSoGio = (gioBatDau, gioKetThuc) => {
    const [h1, m1] = gioBatDau.split(':').map(Number);
    const [h2, m2] = gioKetThuc.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
};

// ─── Đặt sân ─────────────────────────────────────────────────────────────────
// POST /api/dat-san
// Body: { san_id, ngay_dat, gio_bat_dau, gio_ket_thuc, ghi_chu }
const datSan = async (req, res) => {
    try {
        const { san_id, ngay_dat, gio_bat_dau, gio_ket_thuc, ghi_chu } = req.body;
        const user_id = req.user.id;

        // 1. Validate đầu vào
        if (!san_id || !ngay_dat || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin: sân, ngày, giờ bắt đầu, giờ kết thúc.',
            });
        }

        // 2. Kiểm tra ngày đặt không được là ngày quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const datDate = new Date(ngay_dat);
        if (datDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Không thể đặt sân cho ngày đã qua.',
            });
        }

        // 3. Kiểm tra giờ hợp lệ
        const soGio = tinhSoGio(gio_bat_dau, gio_ket_thuc);
        if (soGio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Giờ kết thúc phải sau giờ bắt đầu.',
            });
        }
        if (soGio > 8) {
            return res.status(400).json({
                success: false,
                message: 'Không thể đặt quá 8 giờ liên tục.',
            });
        }

        // 4. Kiểm tra sân tồn tại và đang hoạt động
        const [san] = await db.execute(
            "SELECT * FROM san_bong WHERE id = ? AND trang_thai = 'hoat_dong'",
            [san_id]
        );
        if (san.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sân không tồn tại hoặc đang bảo trì.',
            });
        }

        // 5. Kiểm tra trùng lịch (logic quan trọng nhất)
        // Hai khoảng thời gian [A,B] và [C,D] bị trùng khi: A < D VÀ B > C
        const [conflicts] = await db.execute(
            `SELECT id FROM dat_san
             WHERE san_id = ?
               AND ngay_dat = ?
               AND trang_thai NOT IN ('da_huy')
               AND gio_bat_dau < ?
               AND gio_ket_thuc > ?`,
            [san_id, ngay_dat, gio_ket_thuc, gio_bat_dau]
        );
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Sân đã có người đặt trong khung giờ này! Vui lòng chọn giờ khác.',
            });
        }

        // 6. Tính tổng tiền
        const tong_tien = soGio * san[0].gia_thue;

        // 7. Lưu đơn đặt sân
        const [result] = await db.execute(
            `INSERT INTO dat_san
             (user_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc, so_gio, tong_tien, trang_thai, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'cho_xac_nhan', ?)
             RETURNING id`,
            [user_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc, soGio, tong_tien, ghi_chu || null]
        );

        return res.status(201).json({
            success:  true,
            message:  'Đặt sân thành công! Vui lòng chờ Admin xác nhận.',
            data: {
                id:           result.insertId,
                san_id,
                ten_san:      san[0].ten_san,
                ngay_dat,
                gio_bat_dau,
                gio_ket_thuc,
                so_gio:       soGio,
                tong_tien,
                trang_thai:   'cho_xac_nhan',
            },
        });
    } catch (err) {
        console.error('Lỗi đặt sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ. Vui lòng thử lại.' });
    }
};

// ─── Lấy lịch sử đặt sân của khách hàng đang đăng nhập ──────────────────────
// GET /api/dat-san/cua-toi
// Query: ?trang_thai=cho_xac_nhan&trang=1&gioi_han=10
const layLichSuCuaToi = async (req, res) => {
    try {
        const { trang_thai, trang = 1, gioi_han = 10 } = req.query;
        const offset = (Number(trang) - 1) * Number(gioi_han);

        let sql  = `
            SELECT ds.*, sb.ten_san, sb.loai_san, sb.hinh_anh
            FROM dat_san ds
            JOIN san_bong sb ON ds.san_id = sb.id
            WHERE ds.user_id = ?
        `;
        const args = [req.user.id];

        if (trang_thai) {
            sql += ' AND ds.trang_thai = ?';
            args.push(trang_thai);
        }

        // Đếm tổng
        const [countRows] = await db.execute(
            sql.replace('ds.*, sb.ten_san, sb.loai_san, sb.hinh_anh', 'COUNT(*) as total'),
            args
        );
        const total = countRows[0].total;

        sql += ' ORDER BY ds.ngay_tao DESC LIMIT ? OFFSET ?';
        args.push(Number(gioi_han), offset);

        const [rows] = await db.execute(sql, args);
        return res.json({
            success: true,
            data:    rows,
            phan_trang: {
                tong:      total,
                trang:     Number(trang),
                gioi_han:  Number(gioi_han),
                tong_trang: Math.ceil(total / Number(gioi_han)),
            },
        });
    } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Lấy chi tiết một đơn đặt ────────────────────────────────────────────────
// GET /api/dat-san/:id
const layChiTietDon = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT ds.*, sb.ten_san, sb.loai_san, sb.gia_thue, sb.hinh_anh,
                    u.ho_ten, u.email, u.so_dien_thoai,
                    tt.phuong_thuc, tt.trang_thai AS trang_thai_tt, tt.ngay_thanh_toan
             FROM dat_san ds
             JOIN san_bong sb ON ds.san_id = sb.id
             JOIN users u     ON ds.user_id = u.id
             LEFT JOIN thanh_toan tt ON tt.dat_san_id = ds.id
             WHERE ds.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt sân.' });
        }

        // Chỉ chủ đơn hoặc Admin mới xem được
        if (rows[0].user_id !== req.user.id && req.user.vai_tro !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn này.' });
        }

        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Lỗi lấy chi tiết đơn:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Hủy đặt sân ─────────────────────────────────────────────────────────────
// PUT /api/dat-san/:id/huy
const huySan = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM dat_san WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt sân của bạn.' });
        }

        const don = rows[0];

        if (don.trang_thai === 'da_huy') {
            return res.status(400).json({ success: false, message: 'Đơn này đã bị hủy trước đó.' });
        }
        if (don.trang_thai === 'hoan_thanh') {
            return res.status(400).json({ success: false, message: 'Không thể hủy đơn đã hoàn thành.' });
        }

        // Kiểm tra đơn đã đến ngày chưa
        const ngayDat = new Date(don.ngay_dat);
        const now     = new Date();
        if (ngayDat < now) {
            return res.status(400).json({ success: false, message: 'Không thể hủy đơn của ngày đã qua.' });
        }

        await db.execute(
            "UPDATE dat_san SET trang_thai = 'da_huy' WHERE id = ?",
            [req.params.id]
        );

        return res.json({ success: true, message: 'Hủy đặt sân thành công! Khung giờ này đã được mở lại.' });
    } catch (err) {
        console.error('Lỗi hủy sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── [ADMIN] Lấy tất cả đơn đặt sân ─────────────────────────────────────────
// GET /api/dat-san/admin/tat-ca
// Query: ?trang_thai=cho_xac_nhan&ngay=2024-12-25&san_id=1&trang=1
const adminLayTatCaDon = async (req, res) => {
    try {
        const { trang_thai, ngay, san_id, trang = 1, gioi_han = 20 } = req.query;
        const offset = (Number(trang) - 1) * Number(gioi_han);

        let sql = `
            SELECT ds.*, sb.ten_san, sb.loai_san,
                   u.ho_ten, u.email, u.so_dien_thoai
            FROM dat_san ds
            JOIN san_bong sb ON ds.san_id = sb.id
            JOIN users u     ON ds.user_id = u.id
            WHERE 1=1
        `;
        const args = [];

        if (trang_thai) { sql += ' AND ds.trang_thai = ?'; args.push(trang_thai); }
        if (ngay)       { sql += ' AND ds.ngay_dat = ?';   args.push(ngay); }
        if (san_id)     { sql += ' AND ds.san_id = ?';     args.push(san_id); }

        // Đếm tổng
        const [countRows] = await db.execute(
            sql.replace('ds.*, sb.ten_san, sb.loai_san, u.ho_ten, u.email, u.so_dien_thoai', 'COUNT(*) as total'),
            args
        );
        const total = countRows[0].total;

        sql += ' ORDER BY ds.ngay_tao DESC LIMIT ? OFFSET ?';
        args.push(Number(gioi_han), offset);

        const [rows] = await db.execute(sql, args);
        return res.json({
            success: true,
            data: rows,
            phan_trang: {
                tong:       total,
                trang:      Number(trang),
                gioi_han:   Number(gioi_han),
                tong_trang: Math.ceil(total / Number(gioi_han)),
            },
        });
    } catch (err) {
        console.error('Lỗi admin lấy đơn:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── [ADMIN] Cập nhật trạng thái đơn ─────────────────────────────────────────
// PATCH /api/dat-san/admin/:id/trang-thai
// Body: { trang_thai: 'da_xac_nhan' | 'da_huy' | 'hoan_thanh' }
const adminCapNhatTrangThai = async (req, res) => {
    try {
        const { trang_thai } = req.body;
        const valid = ['da_xac_nhan', 'da_huy', 'hoan_thanh', 'cho_xac_nhan'];
        if (!valid.includes(trang_thai)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        const [existing] = await db.execute('SELECT id FROM dat_san WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn.' });
        }

        await db.execute('UPDATE dat_san SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);

        const labels = {
            da_xac_nhan:   'Đã xác nhận',
            da_huy:        'Đã từ chối',
            hoan_thanh:    'Đã hoàn thành',
            cho_xac_nhan:  'Đang chờ xác nhận',
        };
        return res.json({ success: true, message: `Cập nhật đơn thành "${labels[trang_thai]}" thành công!` });
    } catch (err) {
        console.error('Lỗi admin cập nhật đơn:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

module.exports = {
    datSan,
    layLichSuCuaToi,
    layChiTietDon,
    huySan,
    adminLayTatCaDon,
    adminCapNhatTrangThai,
};
