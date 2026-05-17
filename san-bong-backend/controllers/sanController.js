// controllers/sanController.js
// Xử lý nghiệp vụ: xem sân, thêm/sửa/xóa sân (Admin), kiểm tra lịch trống

const db = require('../config/database');

const taoSlotTrongNgay = (lichDaDat) => {
    const tatCaSlot = [];

    for (let h = 6; h < 22; h += 1) {
        const start = `${String(h).padStart(2, '0')}:00`;
        const end = `${String(h + 1).padStart(2, '0')}:00`;
        const donDat = lichDaDat.find((booking) => {
            const bStart = booking.gio_bat_dau.substring(0, 5);
            const bEnd = booking.gio_ket_thuc.substring(0, 5);
            return start >= bStart && start < bEnd;
        });

        tatCaSlot.push({
            gio: start,
            den: end,
            da_dat: Boolean(donDat),
            trang_thai: donDat?.trang_thai || null,
            dat_san_id: donDat?.id || null,
        });
    }

    return tatCaSlot;
};

// ─── Lấy danh sách sân đang hoạt động ────────────────────────────────────────
// GET /api/san
// Query: ?loai=5 nguoi&gia_max=300000
const layDanhSachSan = async (req, res) => {
    try {
        const { loai, gia_max, gia_min } = req.query;

        let sql    = "SELECT * FROM san_bong WHERE trang_thai = 'hoat_dong'";
        const args = [];

        if (loai) {
            sql += ' AND loai_san = ?';
            args.push(loai);
        }
        if (gia_min) {
            sql += ' AND gia_thue >= ?';
            args.push(Number(gia_min));
        }
        if (gia_max) {
            sql += ' AND gia_thue <= ?';
            args.push(Number(gia_max));
        }
        sql += ' ORDER BY loai_san, gia_thue';

        const [rows] = await db.execute(sql, args);
        return res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error('Lỗi lấy danh sách sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Lấy chi tiết một sân ────────────────────────────────────────────────────
// GET /api/san/:id
const laySanTheoId = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM san_bong WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sân.' });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Lỗi lấy chi tiết sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Kiểm tra lịch trống của sân theo ngày ───────────────────────────────────
// GET /api/san/:id/lich-trong?ngay=2024-12-25
const kiemTraLichTrong = async (req, res) => {
    try {
        const { ngay } = req.query;
        if (!ngay) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày cần kiểm tra.' });
        }

        // Lấy danh sách các slot đã đặt trong ngày đó
        const [booked] = await db.execute(
            `SELECT gio_bat_dau, gio_ket_thuc, trang_thai
             FROM dat_san
             WHERE san_id = ? AND ngay_dat = ? AND trang_thai != 'da_huy'
             ORDER BY gio_bat_dau`,
            [req.params.id, ngay]
        );

        const allSlots = taoSlotTrongNgay(booked);

        return res.json({
            success:      true,
            ngay,
            lich_da_dat:  booked,
            tat_ca_slot:  allSlots,
        });
    } catch (err) {
        console.error('Lỗi kiểm tra lịch trống:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── Lấy lịch đặt/trống của tất cả sân theo ngày ────────────────────────────
// GET /api/san/lich-theo-ngay?ngay=2026-05-18&bao_gom_bao_tri=true
const layLichTatCaSanTheoNgay = async (req, res) => {
    try {
        const { ngay, bao_gom_bao_tri } = req.query;
        if (!ngay) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày cần kiểm tra.' });
        }

        let sanSql = 'SELECT * FROM san_bong';
        const sanArgs = [];
        if (bao_gom_bao_tri !== 'true') {
            sanSql += " WHERE trang_thai = 'hoat_dong'";
        }
        sanSql += ' ORDER BY loai_san, gia_thue, id';

        const [dsSan] = await db.execute(sanSql, sanArgs);
        const [bookings] = await db.execute(
            `SELECT ds.id, ds.san_id, ds.gio_bat_dau, ds.gio_ket_thuc, ds.trang_thai,
                    ds.user_id, u.ho_ten
             FROM dat_san ds
             JOIN users u ON ds.user_id = u.id
             WHERE ds.ngay_dat = ?
               AND ds.trang_thai != 'da_huy'
             ORDER BY ds.san_id, ds.gio_bat_dau`,
            [ngay]
        );

        const bookingsBySan = new Map();
        for (const booking of bookings) {
            if (!bookingsBySan.has(booking.san_id)) {
                bookingsBySan.set(booking.san_id, []);
            }
            bookingsBySan.get(booking.san_id).push(booking);
        }

        const data = dsSan.map((san) => {
            const lichDaDat = bookingsBySan.get(san.id) || [];
            const tatCaSlot = taoSlotTrongNgay(lichDaDat);
            const slotDaDat = tatCaSlot.filter((slot) => slot.da_dat);
            const slotTrong = tatCaSlot.filter((slot) => !slot.da_dat);

            return {
                san,
                lich_da_dat: lichDaDat,
                slot_da_dat: slotDaDat,
                slot_trong: slotTrong,
                tat_ca_slot: tatCaSlot,
                thong_ke: {
                    tong_slot: tatCaSlot.length,
                    so_slot_da_dat: slotDaDat.length,
                    so_slot_trong: slotTrong.length,
                },
            };
        });

        return res.json({
            success: true,
            ngay,
            gio_mo_cua: '06:00',
            gio_dong_cua: '22:00',
            data,
            total: data.length,
        });
    } catch (err) {
        console.error('Lỗi lấy lịch tất cả sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── [ADMIN] Lấy TẤT CẢ sân (kể cả đang bảo trì) ───────────────────────────
// GET /api/san/admin/tat-ca
const layTatCaSan = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM san_bong ORDER BY id');
        return res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error('Lỗi:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── [ADMIN] Thêm sân mới ────────────────────────────────────────────────────
// POST /api/san
// Body: { ten_san, loai_san, gia_thue, mo_ta, hinh_anh }
const themSan = async (req, res) => {
    try {
        const { ten_san, loai_san, gia_thue, mo_ta, hinh_anh } = req.body;

        // Validate
        if (!ten_san || !loai_san || !gia_thue) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: tên sân, loại sân, giá thuê.',
            });
        }
        const loaiHopLe = ['5 nguoi', '7 nguoi', '11 nguoi'];
        if (!loaiHopLe.includes(loai_san)) {
            return res.status(400).json({
                success: false,
                message: 'Loại sân không hợp lệ. Chọn: 5 nguoi, 7 nguoi, 11 nguoi.',
            });
        }
        if (Number(gia_thue) <= 0) {
            return res.status(400).json({ success: false, message: 'Giá thuê phải lớn hơn 0.' });
        }

        const [result] = await db.execute(
            `INSERT INTO san_bong (ten_san, loai_san, gia_thue, mo_ta, hinh_anh, trang_thai)
             VALUES (?, ?, ?, ?, ?, 'hoat_dong')
             RETURNING id`,
            [ten_san.trim(), loai_san, Number(gia_thue), mo_ta || null, hinh_anh || 'default.jpg']
        );

        return res.status(201).json({
            success: true,
            message: `Thêm sân "${ten_san}" thành công!`,
            data:    { id: result.insertId },
        });
    } catch (err) {
        console.error('Lỗi thêm sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── [ADMIN] Cập nhật thông tin sân ──────────────────────────────────────────
// PUT /api/san/:id
// Body: { ten_san, loai_san, gia_thue, mo_ta, hinh_anh, trang_thai }
const capNhatSan = async (req, res) => {
    try {
        const { ten_san, loai_san, gia_thue, mo_ta, hinh_anh, trang_thai } = req.body;

        const [existing] = await db.execute('SELECT id FROM san_bong WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sân.' });
        }

        await db.execute(
            `UPDATE san_bong
             SET ten_san = ?, loai_san = ?, gia_thue = ?, mo_ta = ?, hinh_anh = ?, trang_thai = ?
             WHERE id = ?`,
            [ten_san, loai_san, Number(gia_thue), mo_ta || null, hinh_anh || 'default.jpg', trang_thai || 'hoat_dong', req.params.id]
        );

        return res.json({ success: true, message: 'Cập nhật thông tin sân thành công!' });
    } catch (err) {
        console.error('Lỗi cập nhật sân:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// ─── [ADMIN] Đổi trạng thái sân (vô hiệu hóa / kích hoạt) ───────────────────
// PATCH /api/san/:id/trang-thai
// Body: { trang_thai: 'hoat_dong' | 'bao_tri' }
const doiTrangThaiSan = async (req, res) => {
    try {
        const { trang_thai } = req.body;
        if (!['hoat_dong', 'bao_tri'].includes(trang_thai)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        await db.execute('UPDATE san_bong SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);
        const label = trang_thai === 'hoat_dong' ? 'Kích hoạt' : 'Bảo trì';
        return res.json({ success: true, message: `${label} sân thành công!` });
    } catch (err) {
        console.error('Lỗi đổi trạng thái:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

module.exports = {
    layDanhSachSan,
    laySanTheoId,
    kiemTraLichTrong,
    layLichTatCaSanTheoNgay,
    layTatCaSan,
    themSan,
    capNhatSan,
    doiTrangThaiSan,
};
