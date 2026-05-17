import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../lib/api';
import { fmt, todayISO } from '../lib/utils.jsx';
import { Footer, Navbar } from '../components/Layout.jsx';
import { Empty } from '../components/Empty.jsx';

export function FieldSchedulePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sanId = searchParams.get('id');

  const [ngay, setNgay] = useState(todayISO());
  const [san, setSan] = useState(null);
  const [fields, setFields] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    API.san.danhSach()
      .then((res) => alive && setFields(res.data || []))
      .catch(() => alive && setError('Không tải được danh sách sân.'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!sanId) {
      setSan(null);
      setSlots([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    API.san.chiTiet(sanId)
      .then((res) => alive && setSan(res.data))
      .catch(() => alive && setError('Không tìm thấy sân bóng này.'));
    return () => { alive = false; };
  }, [sanId]);

  useEffect(() => {
    if (!sanId || !ngay) return;
    let alive = true;
    setLoading(true);
    setError('');
    API.san.lichTrong(sanId, ngay)
      .then((res) => alive && setSlots(res.tat_ca_slot || []))
      .catch((err) => alive && setError(err.message || 'Không tải được lịch sân.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [sanId, ngay]);

  const booked = slots.filter((slot) => slot.da_dat).length;
  const available = slots.length - booked;

  function onSelectField(event) {
    const nextId = event.target.value;
    navigate(nextId ? `/lich-san?id=${nextId}` : '/lich-san');
  }

  return (
    <>
      <Navbar />

      <div className="page-hero">
        <div className="container">
          <h1>Lịch đặt sân theo ngày</h1>
          <p>
            {san
              ? `${san.ten_san} · ${fmt.loaiSan(san.loai_san)} · ${fmt.tien(san.gia_thue)} / giờ`
              : 'Xem khung giờ đã đặt và còn trống'}
          </p>
        </div>
      </div>

      <main className="container page-padding">
        <div className="schedule-toolbar">
          <div>
            <span className="schedule-kicker">Chọn sân</span>
            <select className="form-control" value={sanId || ''} onChange={onSelectField}>
              <option value="">Chọn sân để xem lịch</option>
              {fields.map((field) => (
                <option value={field.id} key={field.id}>
                  {field.ten_san} · {fmt.loaiSan(field.loai_san)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="schedule-kicker">Ngày xem lịch</span>
            <input
              type="date"
              className="form-control"
              value={ngay}
              min={todayISO()}
              onChange={(event) => setNgay(event.target.value)}
              disabled={!sanId}
            />
          </div>

          <div className="schedule-stats">
            <div className="schedule-stat"><span>{slots.length}</span><small>Tổng khung</small></div>
            <div className="schedule-stat is-free"><span>{available}</span><small>Còn trống</small></div>
            <div className="schedule-stat is-booked"><span>{booked}</span><small>Đã đặt</small></div>
          </div>

          {sanId ? (
            <Link to={`/dat-san?id=${sanId}`} className="btn btn-primary">Đặt sân này</Link>
          ) : (
            <Link to="/san-bong" className="btn btn-outline">Xem sân</Link>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <section className="schedule-panel">
          <div className="schedule-panel-header">
            <div>
              <h2>Khung giờ ngày {fmt.ngay(ngay)}</h2>
              <p>Màu xanh là còn trống, màu đỏ là đã được đặt.</p>
            </div>
            <div className="schedule-legend">
              <span><i className="legend-free" />Còn trống</span>
              <span><i className="legend-booked" />Đã đặt</span>
            </div>
          </div>

          {!sanId ? (
            <Empty icon="🏟️" text="Chọn một sân ở phía trên để xem các khung giờ đã đặt và còn trống trong ngày." />
          ) : loading ? (
            <div className="schedule-grid">
              {Array.from({ length: 12 }).map((_, index) => <div className="skeleton h-20" key={index} />)}
            </div>
          ) : slots.length ? (
            <div className="schedule-grid">
              {slots.map((slot) => (
                <div
                  className={`schedule-slot ${slot.da_dat ? 'is-booked' : 'is-free'}`}
                  key={`${slot.gio}-${slot.den || ''}`}
                >
                  <strong>
                    {fmt.gio(slot.gio)}
                    {slot.den ? ` - ${fmt.gio(slot.den)}` : ''}
                  </strong>
                  <span>{slot.da_dat ? 'Đã đặt' : 'Còn trống'}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon="📅" text="Không có khung giờ nào cho ngày này." />
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
