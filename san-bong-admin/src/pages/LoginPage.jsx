import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Auth } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const form = new FormData(e.currentTarget);
      const data = await API.auth.dangNhap({
        email: form.get('email'),
        mat_khau: form.get('password'),
      });
      if (data.user.vai_tro !== 'admin') {
        setAlert(['error', 'Tài khoản này không có quyền quản trị.']);
        return;
      }
      Auth.setSession(data.token, data.user);
      setAlert(['success', 'Đăng nhập thành công! Đang chuyển hướng...']);
      setTimeout(() => navigate('/', { replace: true }), 400);
    } catch (err) {
      setAlert(['error', err.message || 'Đăng nhập thất bại.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚽</div>
          <h1>SânBóngPro Admin</h1>
          <p>Quản trị viên · PTIT</p>
        </div>
        <div className="auth-body">
          {alert && (
            <div className={`alert alert-${alert[0]}`}>
              <span className="alert-icon">{alert[0] === 'error' ? '⚠️' : '✓'}</span>
              <span>{alert[1]}</span>
            </div>
          )}
          <form onSubmit={submit}>
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
          </form>
        </div>
      </div>
    </div>
  );
}
