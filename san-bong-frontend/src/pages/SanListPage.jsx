import { useMemo, useState } from 'react';
import { API } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Footer, Navbar } from '../components/Layout.jsx';
import { Loading } from '../components/Loading.jsx';
import { Empty } from '../components/Empty.jsx';
import { SanCard } from '../components/SanCard.jsx';

const LOAI_OPTIONS = [
  ['', 'Tất cả loại sân'],
  ['5 nguoi', '5 người'],
  ['7 nguoi', '7 người'],
  ['11 nguoi', '11 người'],
];

const GIA_OPTIONS = [
  ['', 'Không giới hạn'],
  ['200000', '≤ 200.000 đ/h'],
  ['350000', '≤ 350.000 đ/h'],
  ['600000', '≤ 600.000 đ/h'],
];

export function SanListPage() {
  const { data, loading, error } = useAsync(() => API.san.danhSach().then((r) => r.data), []);
  const [loai, setLoai] = useState('');
  const [gia, setGia] = useState('');

  const list = useMemo(
    () => (data || []).filter((s) => (!loai || s.loai_san === loai) && (!gia || s.gia_thue <= Number(gia))),
    [data, loai, gia],
  );

  function reset() {
    setLoai('');
    setGia('');
  }

  return (
    <>
      <Navbar />

      <div className="page-hero">
        <div className="container">
          <h1>🏟️ Danh sách sân bóng</h1>
          <p>Chọn sân phù hợp với nhu cầu của bạn</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="filter-card">
          <div>
            <label>Loại sân</label>
            <select value={loai} onChange={(e) => setLoai(e.target.value)}>
              {LOAI_OPTIONS.map(([v, label]) => <option value={v} key={label}>{label}</option>)}
            </select>
          </div>
          <div>
            <label>Giá tối đa</label>
            <select value={gia} onChange={(e) => setGia(e.target.value)}>
              {GIA_OPTIONS.map(([v, label]) => <option value={v} key={label}>{label}</option>)}
            </select>
          </div>
          <button onClick={reset} className="btn btn-ghost btn-sm ml-auto">🔄 Đặt lại</button>
          <p className="text-sm font-semibold text-brand-700">{list.length} sân</p>
        </div>

        <div className="grid-san">
          {loading ? (
            <Loading variant="cards" />
          ) : error ? (
            <Empty text="Không tải được dữ liệu. Kiểm tra server." />
          ) : list.length ? (
            list.map((san, i) => <SanCard key={san.id} san={san} index={i} />)
          ) : (
            <Empty icon="🔍" text="Không có sân phù hợp với bộ lọc." />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
