import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, Auth } from '../lib/api';
import { fmt, todayISO } from '../lib/utils.jsx';
import { Footer, Navbar } from '../components/Layout.jsx';
import { Loading } from '../components/Loading.jsx';
import { useToast } from '../components/Toast.jsx';

const PAYMENT_METHODS = [
  ['tien_mat', '💵 Tiền mặt tại sân', true],
  ['chuyen_khoan', '🏦 Chuyển khoản', false],
  ['vi_dien_tu', '📱 Ví điện tử', false],
];

function diffHours(bd, kt) {
  if (!bd || !kt) return 0;
  const start = Number(bd.slice(0, 2)) * 60 + Number(bd.slice(3, 5));
  const end = Number(kt.slice(0, 2)) * 60 + Number(kt.slice(3, 5));
  return (end - start) / 60;
}

export function BookingPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sanId = searchParams.get('id');

  const [san, setSan] = useState(null);
  const [ngay, setNgay] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [bd, setBd] = useState('');
  const [kt, setKt] = useState('');
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!Auth.isLoggedIn()) {
      navigate('/login', { replace: true });
      return;
    }
    if (!sanId) navigate('/san-bong', { replace: true });
  }, [sanId, navigate]);

  useEffect(() => {
    if (!sanId) return;
    API.san.chiTiet(sanId)
      .then((r) => setSan(r.data))
      .catch(() => setAlert('Không tìm thấy sân.'));
  }, [sanId]);

  useEffect(() => {
    if (!sanId || !ngay) return;
    setBd('');
    setKt('');
    API.san.lichTrong(sanId, ngay)
      .then((r) => setSlots(r.tat_ca_slot))
      .catch(() => setSlots([]));
  }, [sanId, ngay]);

  const availableEnds = useMemo(() => {
    if (!bd) return [];
    const after = slots.filter((s) => s.gio > bd);
    const firstBusy = after.findIndex((s) => s.da_dat);
    return firstBusy === -1 ? after : after.slice(0, firstBusy);
  }, [bd, slots]);

  const soGio = diffHours(bd, kt);
  const tongTien = soGio && san ? soGio * san.gia_thue : 0;

  async function book(e) {
    e.preventDefault();
    if (!bd || !kt) {
      setAlert('Vui lòng chọn đầy đủ giờ bắt đầu và kết thúc.');
      return;
    }

    setSaving(true);
    setAlert(null);
    try {
      const form = new FormData(e.currentTarget);
      const datRes = await API.datSan.dat({
        san_id: sanId,
        ngay_dat: ngay,
        gio_bat_dau: bd,
        gio_ket_thuc: kt,
        ghi_chu: form.get('note'),
      });
      await API.thanhToan.tao({
        dat_san_id: datRes.data.id,
        phuong_thuc: form.get('payment'),
      });
      showToast('Đặt sân thành công! 🎉');
      setTimeout(() => navigate('/lich-su'), 1000);
    } catch (err) {
      setAlert(err.message || 'Đặt sân thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />

      <form onSubmit={book} className="container">
        <div className="booking-layout">
          <div>
            <h2 className="mb-6 text-xl font-bold">⚡ Đặt sân bóng</h2>

            <SanInfo san={san} />

            {alert && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{alert}</span>
              </div>
            )}

            <Card title="📅 Chọn ngày đặt">
              <input
                type="date"
                min={todayISO()}
                value={ngay}
                onChange={(e) => setNgay(e.target.value)}
                className="form-control"
              />
            </Card>

            <Card title="🕐 Chọn khung giờ">
              <div className="slot-label">Giờ bắt đầu</div>
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.gio}
                    disabled={slot.da_dat}
                    onClick={() => setBd(slot.gio)}
                    className={`slot ${slot.da_dat ? 'slot-busy' : bd === slot.gio ? 'slot-selected' : 'slot-free'}`}
                  >
                    {slot.gio}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <div className="slot-label">Giờ kết thúc</div>
                <div className="slot-grid">
                  {bd ? availableEnds.map((slot) => (
                    <button
                      type="button"
                      key={slot.den}
                      onClick={() => setKt(slot.den)}
                      className={`slot ${kt === slot.den ? 'slot-selected' : 'slot-free'}`}
                    >
                      {slot.den}
                    </button>
                  )) : (
                    <p className="col-span-full text-sm text-slate-400">Chọn giờ bắt đầu trước.</p>
                  )}
                </div>
              </div>
            </Card>

            <Card title="💳 Phương thức thanh toán" bodyClassName="card-body flex flex-wrap gap-3">
              {PAYMENT_METHODS.map(([value, label, defaultChecked]) => (
                <label key={value}>
                  <input type="radio" name="payment" value={value} defaultChecked={defaultChecked} />{' '}
                  <span>{label}</span>
                </label>
              ))}
            </Card>

            <Card title="📝 Ghi chú">
              <textarea name="note" className="form-control" />
            </Card>
          </div>

          <BookingSummary san={san} ngay={ngay} bd={bd} kt={kt} soGio={soGio} tongTien={tongTien} saving={saving} />
        </div>
      </form>

      <Footer />
    </>
  );
}

function Card({ title, children, bodyClassName = 'card-body' }) {
  return (
    <div className="card mb-5">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function SanInfo({ san }) {
  return (
    <div className="san-info-panel">
      <div className="san-info-thumb">
        <div className="san-thumb-pattern" />
        <span className="relative text-6xl">⚽</span>
      </div>
      <div className="san-info-body">
        {!san ? (
          <Loading />
        ) : (
          <>
            <div className="san-info-name">{san.ten_san}</div>
            <InfoRow label="Loại sân" value={fmt.loaiSan(san.loai_san)} />
            <InfoRow label="Giá thuê" value={`${fmt.tien(san.gia_thue)} / giờ`} />
            <InfoRow
              label="Trạng thái"
              value={<span className="badge badge-green">Đang hoạt động</span>}
            />
            {san.mo_ta && <p className="mt-3 text-sm text-slate-500">{san.mo_ta}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="san-info-row">
      <span className="san-info-label">{label}</span>
      <span className="san-info-value">{value}</span>
    </div>
  );
}

function BookingSummary({ san, ngay, bd, kt, soGio, tongTien, saving }) {
  const rows = [
    ['Sân', san?.ten_san || '—'],
    ['Ngày', fmt.ngay(ngay)],
    ['Giờ bắt đầu', bd || '—'],
    ['Giờ kết thúc', kt || '—'],
    ['Số giờ', soGio ? `${soGio} giờ` : '—'],
    ['Giá/giờ', san ? fmt.tien(san.gia_thue) : '—'],
  ];

  return (
    <div>
      <div className="summary-box">
        <div className="summary-title">TÓM TẮT ĐẶT SÂN</div>

        {rows.map(([label, value]) => (
          <div className="summary-row" key={label}>
            <span className="label">{label}</span>
            <span className="value">{value}</span>
          </div>
        ))}

        <div className="summary-total">
          <span className="label">Tổng tiền</span>
          <span className="value">{tongTien ? fmt.tien(tongTien) : '—'}</span>
        </div>

        <button disabled={!bd || !kt || saving} className="btn btn-amber btn-block btn-lg mt-5">
          {saving ? 'Đang xử lý...' : bd && kt ? '⚡ Xác nhận đặt sân' : 'Chọn giờ để đặt sân'}
        </button>

        <p className="mt-3 text-center text-xs text-white/40">
          Đơn sẽ chờ Admin xác nhận sau khi đặt.
        </p>
      </div>
    </div>
  );
}
