import { Link } from 'react-router-dom';
import { API } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Footer, Navbar } from '../components/Layout.jsx';
import { Loading } from '../components/Loading.jsx';
import { Empty } from '../components/Empty.jsx';
import { SanCard } from '../components/SanCard.jsx';

const STATS = [
  ['5+', 'Sân bóng'],
  ['24/7', 'Đặt sân online'],
  ['3', 'Loại sân'],
  ['100%', 'Xác nhận nhanh'],
];

const STEPS = [
  ['1', 'Chọn sân', 'Tìm sân phù hợp theo loại (5/7/11 người), xem lịch trống theo ngày.'],
  ['2', 'Chọn khung giờ', 'Chọn ngày, giờ bắt đầu và kết thúc. Hệ thống tự kiểm tra còn trống.'],
  ['3', 'Xác nhận & Thanh toán', 'Thanh toán online hoặc tại sân. Admin xác nhận và bạn nhận thông báo.'],
];

export function HomePage() {
  const { data, loading, error } = useAsync(() => API.san.danhSach().then((r) => r.data), []);
  const list = data?.slice(0, 6) || [];

  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-eyebrow">⚡ Đặt sân online siêu nhanh</div>
          <h1>
            Tìm & đặt <em>sân bóng</em>
            <br />
            dễ dàng hơn bao giờ hết
          </h1>
          <p>Hệ thống quản lý sân bóng hiện đại. Chọn sân, chọn giờ, xác nhận xong trong 60 giây.</p>
          <div className="hero-actions">
            <Link to="/san-bong" className="btn-white">Xem sân ngay 🏟️</Link>
            <Link to="/login" className="btn-outline-white">Đăng nhập / Đăng ký</Link>
          </div>
        </div>
      </section>

      <div className="stats-banner">
        <div className="container stats-inner">
          {STATS.map(([n, l]) => (
            <div className="stat-item" key={l}>
              <div className="number">{n}</div>
              <div className="label">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">🏟️ Sân bóng nổi bật</h2>
              <p className="section-sub">Chất lượng cao, giá hợp lý, đặt ngay hôm nay</p>
            </div>
            <Link to="/san-bong" className="btn btn-outline btn-sm">Xem tất cả →</Link>
          </div>

          <div className="grid-san">
            {loading ? (
              <Loading variant="cards" />
            ) : error ? (
              <Empty text="Không thể tải dữ liệu. Kiểm tra server đang chạy chưa." />
            ) : list.length ? (
              list.map((san, i) => <SanCard key={san.id} san={san} index={i} />)
            ) : (
              <Empty icon="🏟️" text="Chưa có sân nào đang hoạt động." />
            )}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Cách đặt sân chỉ 3 bước</h2>
              <p className="section-sub">Đơn giản và nhanh chóng</p>
            </div>
          </div>
          <div className="how-grid">
            {STEPS.map(([n, t, p]) => (
              <div className="how-card" key={n}>
                <div className="how-num">{n}</div>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
