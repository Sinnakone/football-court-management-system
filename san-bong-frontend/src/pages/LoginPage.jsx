import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, Auth } from '../lib/api';

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175/';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!Auth.isLoggedIn()) return;
    if (Auth.isAdmin()) window.location.href = ADMIN_APP_URL;
    else navigate('/', { replace: true });
  }, [navigate]);

  function redirectAfterLogin(user) {
    if (user.vai_tro === 'admin') {
      window.location.href = ADMIN_APP_URL;
    } else {
      navigate(searchParams.get('redirect') || '/', { replace: true });
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const form = new FormData(e.currentTarget);
      const data = await API.auth.dangNhap({
        email: form.get('email'),
        mat_khau: form.get('password'),
      });
      Auth.setSession(data.token, data.user);
      setAlert(['success', 'Đăng nhập thành công! Đang chuyển hướng...']);
      setTimeout(() => redirectAfterLogin(data.user), 500);
    } catch (err) {
      setAlert(['error', err.message || 'Đăng nhập thất bại.']);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(e) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const form = new FormData(e.currentTarget);
      const mat_khau = form.get('password');
      if (mat_khau.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');

      const data = await API.auth.dangKy({
        ho_ten: form.get('name'),
        email: form.get('email'),
        mat_khau,
        so_dien_thoai: form.get('phone'),
      });
      Auth.setSession(data.token, data.user);
      setAlert(['success', 'Đăng ký thành công! Đang chuyển hướng...']);
      setTimeout(() => navigate('/', { replace: true }), 500);
    } catch (err) {
      setAlert(['error', err.message || 'Đăng ký thất bại.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚽</div>
          <h1>SânBóngPro</h1>
          <p>Quản lý sân bóng · PTIT</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Đăng nhập
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            Đăng ký
          </button>
        </div>

        <div className="auth-body">
          {alert && (
            <div className={`alert alert-${alert[0]}`}>
              <span className="alert-icon">{alert[0] === 'error' ? '⚠️' : '✓'}</span>
              <span>{alert[1]}</span>
            </div>
          )}

          {tab === 'login' ? (
            <LoginForm loading={loading} onSubmit={submitLogin} onSwitch={() => setTab('register')} />
          ) : (
            <RegisterForm loading={loading} onSubmit={submitRegister} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ loading, onSubmit, onSwitch }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input name="email" type="email" className="form-control" required autoComplete="email" />
      </div>
      <div className="form-group">
        <label className="form-label">Mật khẩu</label>
        <input name="password" type="password" className="form-control" required autoComplete="current-password" />
      </div>
      <button disabled={loading} className="btn btn-primary btn-block btn-lg">
        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
      </button>
      <p className="mt-4 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <button type="button" className="font-semibold text-brand-700" onClick={onSwitch}>
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ loading, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label">Họ và tên *</label>
        <input name="name" className="form-control" required />
      </div>
      <div className="form-group">
        <label className="form-label">Email *</label>
        <input name="email" type="email" className="form-control" required />
      </div>
      <div className="form-group">
        <label className="form-label">Mật khẩu *</label>
        <input name="password" type="password" className="form-control" required />
        <div className="form-hint">Ít nhất 6 ký tự</div>
      </div>
      <div className="form-group">
        <label className="form-label">Số điện thoại</label>
        <input name="phone" className="form-control" />
      </div>
      <button disabled={loading} className="btn btn-primary btn-block btn-lg">
        {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
      </button>
    </form>
  );
}
