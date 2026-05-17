import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Auth } from '../lib/api';
import { fmt } from '../lib/utils.jsx';

const adminLinks = [
  ['/', '📊', 'Dashboard', 'Tổng quan'],
  ['/don-dat-san', '📋', 'Đơn đặt sân', 'Quản lý'],
  ['/san-bong', '🏟️', 'Sân bóng', 'Quản lý'],
  ['/nguoi-dung', '👥', 'Người dùng', 'Quản lý'],
  ['/bao-cao', '📈', 'Doanh thu', 'Báo cáo'],
];

export function AdminLayout({ title, children, topbarRight }) {
  const navigate = useNavigate();
  const user = Auth.getUser();

  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  function logout() {
    Auth.clear();
    navigate('/login', { replace: true });
  }

  const sections = [];
  for (const link of adminLinks) {
    const [, , , section] = link;
    const last = sections[sections.length - 1];
    if (last && last.section === section) last.links.push(link);
    else sections.push({ section, links: [link] });
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚽</div>
          <div><div className="sidebar-logo-text">SânBóngPro</div><div className="sidebar-logo-sub">Quản trị viên</div></div>
        </div>
        <nav className="sidebar-nav">
          {sections.map(({ section, links }) => (
            <div key={section}>
              <div className="sidebar-section-label">{section}</div>
              {links.map(([to, icon, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-link-icon">{icon}</span>{label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="sidebar-user w-full text-left" onClick={logout}>
            <div className="user-avatar" style={{ background: 'var(--green-700)', color: 'white' }}>{fmt.avatarText(user?.ho_ten)}</div>
            <div className="sidebar-user-info"><div className="name">{user?.ho_ten || 'Admin'}</div><div className="role">Quản trị viên</div></div>
            <span style={{ color: 'rgba(255,255,255,.3)', marginLeft: 'auto' }}>⎋</span>
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <div className="admin-topbar">
          <span className="admin-topbar-title">{title}</span>
          {topbarRight}
        </div>
        <div className="admin-page-body">{children}</div>
      </main>
    </div>
  );
}
