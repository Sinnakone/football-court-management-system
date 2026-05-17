import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';
import { Chart, ArcElement, BarController, BarElement, CategoryScale, DoughnutController, LinearScale, Tooltip } from 'chart.js';
import { API, Auth } from './lib/api';
import { fmt, monthStartISO, StatusBadge, todayISO } from './lib/utils.jsx';
import { AdminLayout } from './components/Layout.jsx';
import { useToast } from './components/Toast.jsx';
import LoginPage from './pages/LoginPage.jsx';

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, LinearScale, Tooltip);

const thumbs = [
  { cls: 'san-thumbnail-green', icon: '⚽' },
  { cls: 'san-thumbnail-teal', icon: '🏃' },
  { cls: 'san-thumbnail-blue', icon: '🥅' },
];

function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => alive && setState({ loading: false, data, error: null }))
      .catch((error) => alive && setState({ loading: false, data: null, error }));
    return () => {
      alive = false;
    };
  }, deps);
  return state;
}

function Loading({ text = 'Đang tải...' }) {
  return <div className="loading-state"><div className="spinner" /><p>{text}</p></div>;
}

function AdminDashboard() {
  const { data } = useAsync(() => API.admin.dashboard().then((r) => r.data), []);
  return <AdminLayout active="dashboard" title="Dashboard" topbarRight={<span className="text-sm text-slate-400">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>}><div className="grid-4 mb-8">{[['🏟️', data?.so_san ?? '—', 'Sân đang hoạt động'], ['⏳', data?.don_cho_duyet ?? '—', 'Đơn chờ xác nhận'], ['📅', data?.don_hom_nay ?? '—', 'Đơn hôm nay'], ['💰', data ? `${(data.doanh_thu_thang / 1e6).toFixed(1)}M` : '—', 'Doanh thu tháng']].map(([i, v, l]) => <div className="stat-card" key={l}><div className="stat-icon stat-icon-green">{i}</div><div><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div></div>)}</div><div className="grid-2"><div className="card"><div className="card-header"><span className="card-title">🔔 Đơn đặt mới nhất</span><Link to="/don-dat-san" className="btn btn-ghost btn-sm">Xem tất cả →</Link></div><TableOrders items={data?.don_moi_nhat || []} /></div><div className="card"><div className="card-header"><span className="card-title">📊 Thống kê nhanh</span></div><div className="card-body">{data ? <div className="flex flex-col gap-3">{[['Doanh thu hôm nay', fmt.tien(data.doanh_thu_hom_nay)], ['Doanh thu tháng này', fmt.tien(data.doanh_thu_thang)], ['Tổng khách hàng', data.so_khach_hang], ['Đơn chờ xử lý', data.don_cho_duyet]].map(([l, v]) => <div className="flex justify-between border-b border-slate-100 py-2" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div> : <Loading />}</div></div></div></AdminLayout>;
}

function TableOrders({ items, adminActions, onChange }) {
  if (!items.length) return <div className="empty-state"><p>Không có đơn nào phù hợp.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>#</th><th>Khách hàng</th><th>Sân bóng</th><th>Ngày đặt</th><th>Giờ</th><th>Tổng tiền</th><th>Trạng thái</th>{adminActions && <th>Thao tác</th>}</tr></thead><tbody>{items.map((d) => <tr key={d.id}><td>#{d.id}</td><td><strong>{d.ho_ten}</strong><div className="text-xs text-slate-400">{d.so_dien_thoai || ''}</div></td><td><strong>{d.ten_san}</strong><div className="text-xs text-slate-400">{fmt.loaiSan(d.loai_san)}</div></td><td>{fmt.ngay(d.ngay_dat)}</td><td>{fmt.gio(d.gio_bat_dau)} - {fmt.gio(d.gio_ket_thuc)}</td><td className="font-bold text-brand-700">{fmt.tien(d.tong_tien)}</td><td><StatusBadge value={d.trang_thai} /></td>{adminActions && <td><div className="flex flex-wrap gap-2">{d.trang_thai === 'cho_xac_nhan' && <><button onClick={() => onChange(d.id, 'da_xac_nhan')} className="btn btn-success btn-sm">Xác nhận</button><button onClick={() => onChange(d.id, 'da_huy')} className="btn btn-danger btn-sm">Từ chối</button></>}{d.trang_thai === 'da_xac_nhan' && <button onClick={() => onChange(d.id, 'hoan_thanh')} className="btn btn-info btn-sm">Hoàn thành</button>}</div></td>}</tr>)}</tbody></table></div>;
}

function AdminOrders() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [tt, setTt] = useState(searchParams.get('filter') || '');
  const [ngay, setNgay] = useState('');
  useEffect(() => { API.datSan.adminTatCa().then((r) => setItems(r.data)).catch(() => setItems([])); }, []);
  const list = items.filter((d) => (!tt || d.trang_thai === tt) && (!ngay || d.ngay_dat.slice(0, 10) === ngay));
  async function change(id, trang_thai) {
    await API.datSan.adminTT(id, trang_thai);
    setItems((xs) => xs.map((d) => d.id === id ? { ...d, trang_thai } : d));
    showToast('Cập nhật thành công!');
  }
  return <AdminLayout active="don" title="📋 Quản lý đơn đặt sân"><div className="filter-bar"><select className="filter-select" value={tt} onChange={(e) => setTt(e.target.value)}><option value="">Tất cả trạng thái</option><option value="cho_xac_nhan">⏳ Chờ xác nhận</option><option value="da_xac_nhan">✓ Đã xác nhận</option><option value="hoan_thanh">🏁 Hoàn thành</option><option value="da_huy">✕ Đã hủy</option></select><input type="date" className="filter-select" value={ngay} onChange={(e) => setNgay(e.target.value)} /><button className="btn btn-ghost btn-sm" onClick={() => { setTt(''); setNgay(''); }}>🔄 Đặt lại</button><span className="ml-auto text-sm text-slate-500">{list.length} đơn</span></div><div className="card"><TableOrders items={list} adminActions onChange={change} /></div></AdminLayout>;
}

function AdminFields() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [tt, setTt] = useState('');
  const [loai, setLoai] = useState('');
  const load = () => API.san.tatCa().then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const list = items.filter((s) => (!tt || s.trang_thai === tt) && (!loai || s.loai_san === loai));
  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = { ten_san: form.get('ten_san'), loai_san: form.get('loai_san'), gia_thue: Number(form.get('gia_thue')), mo_ta: form.get('mo_ta'), trang_thai: form.get('trang_thai') || 'hoat_dong' };
    if (editing?.id) await API.san.capNhat(editing.id, body); else await API.san.them(body);
    showToast('Lưu sân thành công!');
    setEditing(null); load();
  }
  async function toggle(s) {
    const next = s.trang_thai === 'hoat_dong' ? 'bao_tri' : 'hoat_dong';
    await API.san.doiTrangThai(s.id, next);
    setItems((xs) => xs.map((x) => x.id === s.id ? { ...x, trang_thai: next } : x));
  }
  return <AdminLayout active="san" title="🏟️ Quản lý sân bóng" topbarRight={<button onClick={() => setEditing({})} className="btn btn-primary btn-sm">+ Thêm sân mới</button>}><div className="filter-bar"><select className="filter-select" value={tt} onChange={(e) => setTt(e.target.value)}><option value="">Tất cả trạng thái</option><option value="hoat_dong">Đang hoạt động</option><option value="bao_tri">🔧 Bảo trì</option></select><select className="filter-select" value={loai} onChange={(e) => setLoai(e.target.value)}><option value="">Tất cả loại</option><option value="5 nguoi">5 người</option><option value="7 nguoi">7 người</option><option value="11 nguoi">11 người</option></select><span className="ml-auto text-sm text-slate-500">{list.length} sân</span></div><div className="san-grid">{list.map((san, i) => { const th = san.trang_thai === 'bao_tri' ? { cls: 'san-thumb-gray', icon: '🔧' } : { cls: thumbs[i % 3].cls.replace('thumbnail', 'thumb'), icon: thumbs[i % 3].icon }; return <div className="san-admin-card" key={san.id}><div className={`san-thumb ${th.cls}`}><div className="san-thumb-pattern" /><div className="san-thumb-icon">{th.icon}</div><div className={`san-status-overlay ${san.trang_thai === 'hoat_dong' ? 'san-status-active' : 'san-status-maintenance'}`}>{san.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Bảo trì'}</div></div><div className="san-admin-body"><div className="san-admin-name">{san.ten_san}</div><div className="san-admin-meta">{fmt.loaiSan(san.loai_san)}</div><div className="san-admin-price">{fmt.tien(san.gia_thue)} <span className="text-xs font-normal text-slate-500">/ giờ</span></div>{san.mo_ta && <p className="mt-2 text-xs text-slate-500">{san.mo_ta.slice(0, 80)}</p>}<div className="san-admin-actions"><button onClick={() => setEditing(san)} className="btn btn-outline btn-sm flex-1">Sửa</button><button onClick={() => toggle(san)} className="btn btn-warning btn-sm flex-1">{san.trang_thai === 'hoat_dong' ? 'Bảo trì' : 'Kích hoạt'}</button></div></div></div>; })}</div>{editing && <div className="modal-overlay"><form onSubmit={save} className="modal"><div className="modal-header"><span className="modal-title">{editing.id ? 'Sửa thông tin sân' : 'Thêm sân mới'}</span><button type="button" className="modal-close" onClick={() => setEditing(null)}>✕</button></div><div className="modal-body"><div className="form-group"><label className="form-label">Tên sân *</label><input name="ten_san" className="form-control" defaultValue={editing.ten_san || ''} required /></div><div className="grid-2 gap-3"><div className="form-group"><label className="form-label">Loại sân</label><select name="loai_san" className="form-control" defaultValue={editing.loai_san || '5 nguoi'}><option value="5 nguoi">5 người</option><option value="7 nguoi">7 người</option><option value="11 nguoi">11 người</option></select></div><div className="form-group"><label className="form-label">Giá thuê/giờ</label><input name="gia_thue" type="number" className="form-control" defaultValue={editing.gia_thue || ''} required /></div></div><div className="form-group"><label className="form-label">Mô tả</label><textarea name="mo_ta" className="form-control" defaultValue={editing.mo_ta || ''} /></div>{editing.id && <div className="form-group"><label className="form-label">Trạng thái</label><select name="trang_thai" className="form-control" defaultValue={editing.trang_thai}><option value="hoat_dong">Đang hoạt động</option><option value="bao_tri">Bảo trì</option></select></div>}</div><div className="modal-footer"><button type="button" onClick={() => setEditing(null)} className="btn btn-ghost">Hủy</button><button className="btn btn-primary">Lưu sân</button></div></form></div>}</AdminLayout>;
}

function AdminUsers() {
  const { showToast } = useToast();
  const me = Auth.getUser();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [tt, setTt] = useState('');
  const [role, setRole] = useState('');
  useEffect(() => { API.admin.nguoiDung('?gioi_han=200').then((r) => setUsers(r.data)).catch(() => setUsers([])); }, []);
  const list = users.filter((u) => (!q || `${u.ho_ten} ${u.email} ${u.so_dien_thoai || ''}`.toLowerCase().includes(q.toLowerCase())) && (!tt || u.trang_thai === tt) && (!role || u.vai_tro === role));
  async function toggle(u) {
    const trang_thai = u.trang_thai === 'hoat_dong' ? 'bi_khoa' : 'hoat_dong';
    await API.admin.doiTTUser(u.id, trang_thai);
    setUsers((xs) => xs.map((x) => x.id === u.id ? { ...x, trang_thai } : x));
    showToast('Cập nhật tài khoản thành công!');
  }
  return (
    <AdminLayout active="users" title="👥 Quản lý người dùng">
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email, SĐT..." />
        </div>
        <select className="filter-select" value={tt} onChange={(e) => setTt(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="hoat_dong">Hoạt động</option>
          <option value="bi_khoa">Bị khóa</option>
        </select>
        <select className="filter-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="khach_hang">Khách hàng</option>
          <option value="admin">Admin</option>
        </select>
        <span className="ml-auto text-sm text-slate-500">{list.length} người dùng</span>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Người dùng</th><th>Email</th><th>Số điện thoại</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td><div className="flex items-center gap-2"><div className="user-avatar">{fmt.avatarText(u.ho_ten)}</div><strong>{u.ho_ten}</strong></div></td>
                <td>{u.email}</td>
                <td>{u.so_dien_thoai || '—'}</td>
                <td><span className={`badge ${u.vai_tro === 'admin' ? 'badge-green' : 'badge-slate'}`}>{u.vai_tro === 'admin' ? 'Admin' : 'Khách hàng'}</span></td>
                <td>{fmt.ngay(u.ngay_tao)}</td>
                <td><span className={`badge ${u.trang_thai === 'hoat_dong' ? 'badge-green' : 'badge-red'}`}>{u.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Bị khóa'}</span></td>
                <td>
                  {u.id !== me?.id && u.vai_tro !== 'admin' ? (
                    <button onClick={() => toggle(u)} className={`btn ${u.trang_thai === 'hoat_dong' ? 'btn-danger' : 'btn-success'} btn-sm`}>
                      {u.trang_thai === 'hoat_dong' ? 'Khóa' : 'Mở khóa'}
                    </button>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function AdminReport() {
  const [tu, setTu] = useState(monthStartISO());
  const [den, setDen] = useState(todayISO());
  const [loai, setLoai] = useState('ngay');
  const [data, setData] = useState(null);
  const barRef = useRef(null);
  const pieRef = useRef(null);
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!data) return;
    const bar = new Chart(barRef.current, { type: 'bar', data: { labels: data.chi_tiet.map((r) => r.ky), datasets: [{ data: data.chi_tiet.map((r) => r.doanh_thu || 0), backgroundColor: 'rgba(22,163,74,.8)', borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    const tq = data.tong_quan;
    const pie = new Chart(pieRef.current, { type: 'doughnut', data: { labels: ['Hoàn thành', 'Chờ xác nhận', 'Đã hủy'], datasets: [{ data: [tq.don_hoan_thanh, tq.don_cho_duyet, tq.don_da_huy], backgroundColor: ['#16a34a', '#f59e0b', '#ef4444'] }] }, options: { plugins: { legend: { display: false } }, cutout: '65%' } });
    return () => { bar.destroy(); pie.destroy(); };
  }, [data]);
  function load() { API.admin.doanhThu(`?tu_ngay=${tu}&den_ngay=${den}&loai=${loai}`).then((r) => setData(r.data)); }
  const tq = data?.tong_quan;
  return <AdminLayout active="report" title="📈 Báo cáo doanh thu" topbarRight={<div className="flex items-center gap-2"><select className="filter-select" value={loai} onChange={(e) => setLoai(e.target.value)}><option value="ngay">Theo ngày</option><option value="thang">Theo tháng</option></select><input type="date" className="filter-select" value={tu} onChange={(e) => setTu(e.target.value)} /><input type="date" className="filter-select" value={den} onChange={(e) => setDen(e.target.value)} /><button onClick={load} className="btn btn-primary btn-sm">Áp dụng</button></div>}><div className="report-grid">{[['💰', tq?.doanh_thu_thuc, 'Doanh thu thực'], ['📋', tq?.tong_don, 'Tổng đơn đặt'], ['🏁', tq?.don_hoan_thanh, 'Đơn hoàn thành'], ['✕', tq?.don_da_huy, 'Đơn đã hủy']].map(([i, v, l]) => <div className="stat-card" key={l}><div className="stat-icon stat-icon-green">{i}</div><div><div className="stat-value">{typeof v === 'number' && l.includes('Doanh') ? fmt.tien(v) : v ?? '—'}</div><div className="stat-label">{l}</div></div></div>)}</div><div className="chart-grid"><div className="chart-card"><div className="chart-title">📊 Doanh thu theo kỳ</div><canvas ref={barRef} /></div><div className="chart-card"><div className="chart-title">🏆 Top sân được đặt nhiều nhất</div>{data?.top_san?.map((s, i) => <div className="top-san-row" key={s.ten_san}><div className={`top-san-rank rank-${i + 1}`}>{i + 1}</div><div className="top-san-info"><div className="top-san-name">{s.ten_san}</div><div className="top-san-meta">{fmt.loaiSan(s.loai_san)} · {s.so_lan_dat} lần đặt</div></div><div className="top-san-val">{fmt.tien(s.doanh_thu)}</div></div>)}</div></div><div className="grid grid-cols-[300px_1fr] gap-6"><div className="chart-card"><div className="chart-title">🥧 Tỉ lệ trạng thái đơn</div><canvas ref={pieRef} /></div><div className="chart-card table-wrap"><table><thead><tr><th>Kỳ</th><th>Số đơn</th><th>Doanh thu</th></tr></thead><tbody>{data?.chi_tiet?.map((r) => <tr key={r.ky}><td>{r.ky}</td><td>{r.so_don}</td><td>{fmt.tien(r.doanh_thu || 0)}</td></tr>)}</tbody></table></div></div></AdminLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/don-dat-san" element={<AdminOrders />} />
      <Route path="/san-bong" element={<AdminFields />} />
      <Route path="/nguoi-dung" element={<AdminUsers />} />
      <Route path="/bao-cao" element={<AdminReport />} />
      <Route path="*" element={<AdminDashboard />} />
    </Routes>
  );
}
