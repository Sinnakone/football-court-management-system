import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API, Auth } from '../lib/api';
import { fmt, StatusBadge } from '../lib/utils.jsx';
import { Footer, Navbar } from '../components/Layout.jsx';
import { Empty } from '../components/Empty.jsx';
import { useToast } from '../components/Toast.jsx';

const FILTERS = [
  ['', 'Tất cả'],
  ['cho_xac_nhan', 'Chờ xác nhận'],
  ['da_xac_nhan', 'Đã xác nhận'],
  ['hoan_thanh', 'Hoàn thành'],
  ['da_huy', 'Đã hủy'],
];

const CANCELLABLE = ['cho_xac_nhan', 'da_xac_nhan'];

export function HistoryPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!Auth.isLoggedIn()) {
      navigate('/login', { replace: true });
      return;
    }
    API.datSan.cuaToi()
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, [navigate]);

  const list = filter ? items.filter((d) => d.trang_thai === filter) : items;

  async function cancel(id) {
    if (!confirm('Bạn có chắc muốn hủy đơn đặt sân này không?')) return;
    await API.datSan.huy(id);
    showToast('Hủy đặt sân thành công!');
    setItems((xs) => xs.map((d) => (d.id === id ? { ...d, trang_thai: 'da_huy' } : d)));
  }

  return (
    <>
      <Navbar />

      <div className="container page-padding">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📋 Lịch sử đặt sân</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi các đơn đặt sân của bạn</p>
          </div>
          <Link to="/san-bong" className="btn btn-primary btn-sm">+ Đặt sân mới</Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`btn btn-sm ${filter === value ? 'btn-primary' : 'btn-ghost'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {list.length ? (
            list.map((don) => <BookingRow key={don.id} don={don} onCancel={cancel} />)
          ) : (
            <Empty icon="📋" text="Không có đơn đặt sân nào." />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

function BookingRow({ don, onCancel }) {
  const canCancel = CANCELLABLE.includes(don.trang_thai);

  return (
    <div className="booking-card">
      <div className="booking-icon">⚽</div>

      <div className="booking-main">
        <div className="booking-name">{don.ten_san}</div>
        <div className="booking-meta">
          <span>📅 {fmt.ngay(don.ngay_dat)}</span>
          <span>🕐 {fmt.gio(don.gio_bat_dau)} - {fmt.gio(don.gio_ket_thuc)}</span>
          <span>{fmt.loaiSan(don.loai_san)}</span>
        </div>
        <div className="mt-2">
          <StatusBadge value={don.trang_thai} />
        </div>
        {don.ghi_chu && <div className="mt-2 text-xs text-slate-400">📝 {don.ghi_chu}</div>}
      </div>

      <div className="booking-right">
        <div className="booking-price">{fmt.tien(don.tong_tien)}</div>
        <div className="text-xs text-slate-400">{don.so_gio} giờ</div>
        {canCancel && (
          <button onClick={() => onCancel(don.id)} className="btn btn-danger btn-sm mt-2">
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}
