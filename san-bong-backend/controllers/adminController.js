// controllers/adminController.js
// Xử lý nghiệp vụ Admin: báo cáo doanh thu, quản lý người dùng

const db = require('../config/database');

// ─── Báo cáo doanh thu theo ngày ─────────────────────────────────────────────
// GET /api/admin/bao-cao/doanh-thu
// Query: ?tu_ngay=2024-01-01&den_ngay=2024-12-31&loai=ngay|thang
const baoCaoDoanhThu = async (req, res) => {
    try {
        const {
            tu_ngay  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            den_ngay = new Date().toISOString().split('T')[0],
            loai     = 'ngay',
        } = req.query;

        // 1. Thống kê tổng quan
        const [tongQuan] = await db.execute(
            `SELECT
                COUNT(*)                                                      AS tong_don,
                SUM(tong_tien)                                                AS tong_doanh_thu,
                SUM(CASE WHEN trang_thai = 'hoan_thanh'   THEN 1 ELSE 0 END) AS don_hoan_thanh,
                SUM(CASE WHEN trang_thai = 'da_huy'       THEN 1 ELSE 0 END) AS don_da_huy,
                SUM(CASE WHEN trang_thai = 'cho_xac_nhan' THEN 1 ELSE 0 END) AS don_cho_duyet,
                SUM(CASE WHEN trang_thai != 'da_huy'      THEN tong_tien ELSE 0 END) AS doanh_thu_thuc
             FROM dat_san
             WHERE ngay_dat BETWEEN ? AND ?`,
            [tu_ngay, den_ngay]
        );

        // 2. Thống kê theo ngày hoặc tháng
        const groupBy = loai === 'thang' ? "TO_CHAR(ngay_dat, 'YYYY-MM')" : 'ngay_dat';
        const [chiTiet] = await db.execute(
            `SELECT
                ${groupBy} AS ky,
                COUNT(*)   AS so_don,
                SUM(CASE WHEN trang_thai != 'da_huy' THEN tong_tien ELSE 0 END) AS doanh_thu
             FROM dat_san
             WHERE ngay_dat BETWEEN ? AND ?
             GROUP BY ky
             ORDER BY ky`,
            [tu_ngay, den_ngay]
        );

        // 3. Sân được đặt nhiều nhất
        const [topSan] = await db.execute(
            `SELECT sb.ten_san, sb.loai_san, COUNT(ds.id) AS so_lan_dat,
                    SUM(CASE WHEN ds.trang_thai != 'da_huy' THEN ds.tong_tien ELSE 0 END) AS doanh_thu
             FROM dat_san ds
             JOIN san_bong sb ON ds.san_id = sb.id
             WHERE ds.ngay_dat BETWEEN ? AND ?
             GROUP BY ds.san_id, sb.ten_san, sb.loai_san
             ORDER BY so_lan_dat DESC
             LIMIT 5`,
            [tu_ngay, den_ngay]
        );

        return res.json({
            success: true,
            data: {
                tu_ngay,
                den_ngay,
                tong_quan:   tongQuan[0],
                chi_tiet:    chiTiet,
                top_san:     topSan,
            },
        });
    } catch (err) {
        console.error('Lỗi báo cáo doanh thu:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Thống kê dashboard tổng quan ────────────────────────────────────────────
// GET /api/admin/dashboard
const dashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [[sanHoatDong]]    = await db.execute("SELECT COUNT(*) AS total FROM san_bong WHERE trang_thai='hoat_dong'");
        const [[tongKhachHang]]  = await db.execute("SELECT COUNT(*) AS total FROM users WHERE vai_tro='khach_hang'");
        const [[donHomNay]]      = await db.execute("SELECT COUNT(*) AS total, SUM(tong_tien) AS doanh_thu FROM dat_san WHERE ngay_dat=? AND trang_thai!='da_huy'", [today]);
        const [[donChoDuyet]]    = await db.execute("SELECT COUNT(*) AS total FROM dat_san WHERE trang_thai='cho_xac_nhan'");
        const [[doanhThuThang]]  = await db.execute(
            "SELECT SUM(tong_tien) AS total FROM dat_san WHERE DATE_TRUNC('month', ngay_dat::timestamp) = DATE_TRUNC('month', CURRENT_DATE::timestamp) AND trang_thai!='da_huy'"
        );

        // 5 đơn mới nhất
        const [donMoiNhat] = await db.execute(
            `SELECT ds.id, ds.ngay_dat, ds.gio_bat_dau, ds.gio_ket_thuc, ds.tong_tien, ds.trang_thai,
                    sb.ten_san, u.ho_ten
             FROM dat_san ds
             JOIN san_bong sb ON ds.san_id = sb.id
             JOIN users u ON ds.user_id = u.id
             ORDER BY ds.ngay_tao DESC LIMIT 5`
        );

        return res.json({
            success: true,
            data: {
                so_san:          sanHoatDong.total,
                so_khach_hang:   tongKhachHang.total,
                don_hom_nay:     donHomNay.total,
                doanh_thu_hom_nay: donHomNay.doanh_thu || 0,
                don_cho_duyet:   donChoDuyet.total,
                doanh_thu_thang: doanhThuThang.total || 0,
                don_moi_nhat:    donMoiNhat,
            },
        });
    } catch (err) {
        console.error('Lỗi dashboard:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Lấy danh sách người dùng ────────────────────────────────────────────────
// GET /api/admin/nguoi-dung
// Query: ?vai_tro=khach_hang&trang_thai=hoat_dong&tim=nguyen
const layDanhSachNguoiDung = async (req, res) => {
    try {
        const { vai_tro, trang_thai, tim, trang = 1, gioi_han = 20 } = req.query;
        const offset = (Number(trang) - 1) * Number(gioi_han);

        let sql  = 'SELECT id, ho_ten, email, so_dien_thoai, vai_tro, trang_thai, ngay_tao FROM users WHERE 1=1';
        const args = [];

        if (vai_tro)    { sql += ' AND vai_tro = ?';    args.push(vai_tro); }
        if (trang_thai) { sql += ' AND trang_thai = ?'; args.push(trang_thai); }
        if (tim) {
            sql += ' AND (ho_ten ILIKE ? OR email ILIKE ? OR so_dien_thoai ILIKE ?)';
            const keyword = `%${tim}%`;
            args.push(keyword, keyword, keyword);
        }

        const [countRows] = await db.execute(
            sql.replace('id, ho_ten, email, so_dien_thoai, vai_tro, trang_thai, ngay_tao', 'COUNT(*) as total'),
            args
        );
        const total = countRows[0].total;

        sql += ' ORDER BY ngay_tao DESC LIMIT ? OFFSET ?';
        args.push(Number(gioi_han), offset);

        const [rows] = await db.execute(sql, args);
        return res.json({
            success: true,
            data: rows,
            phan_trang: { tong: total, trang: Number(trang), tong_trang: Math.ceil(total / Number(gioi_han)) },
        });
    } catch (err) {
        console.error('Lỗi lấy danh sách user:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Khóa / Mở khóa tài khoản ────────────────────────────────────────────────
// PATCH /api/admin/nguoi-dung/:id/trang-thai
// Body: { trang_thai: 'hoat_dong' | 'bi_khoa' }
const doiTrangThaiNguoiDung = async (req, res) => {
    try {
        const { trang_thai } = req.body;
        if (!['hoat_dong', 'bi_khoa'].includes(trang_thai)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        // Không tự khóa chính mình
        if (Number(req.params.id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản của chính mình.' });
        }

        await db.execute('UPDATE users SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);
        const label = trang_thai === 'hoat_dong' ? 'Mở khóa' : 'Khóa';
        return res.json({ success: true, message: `${label} tài khoản thành công!` });
    } catch (err) {
        console.error('Lỗi đổi trạng thái user:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

module.exports = { baoCaoDoanhThu, dashboard, layDanhSachNguoiDung, doiTrangThaiNguoiDung };
