import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Auth } from '../lib/api';
import { fmt } from '../lib/utils.jsx';

export function Navbar() {
  const user = Auth.getUser();
  const navigate = useNavigate();

  function logout() {
    Auth.clear();
    navigate('/');
  }

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <div className="logo-icon">⚽</div>
        <Link to="/">
          SânBóng<span style={{ color: 'var(--green-500)' }}>Pro</span>
        </Link>
      </div>
      <nav className="navbar-links">
        <NavLink to="/" end className={navClass}>Trang chủ</NavLink>
        <NavLink to="/san-bong" className={navClass}>Sân bóng</NavLink>
        <NavLink to="/lich-su" className={navClass}>Lịch sử đặt</NavLink>
      </nav>
      <div className="navbar-actions">
        {!user ? (
          <Link to="/login" className="btn btn-primary btn-sm">Đăng nhập</Link>
        ) : (
          <div className="navbar-user">
            <div className="user-avatar">{fmt.avatarText(user.ho_ten)}</div>
            <span className="user-name">{user.ho_ten}</span>
            <button onClick={logout} className="btn btn-ghost btn-sm">Đăng xuất</button>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <div style={{ background: 'var(--slate-900)', color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '1.5rem', fontSize: 13, marginTop: '4rem' }}>
      © 2024 SânBóngPro · Hệ thống quản lý sân bóng · PTIT
    </div>
  );
}
