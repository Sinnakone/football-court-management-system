export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isLoggedIn: () => Boolean(localStorage.getItem('token')),
  isAdmin: () => Auth.getUser()?.vai_tro === 'admin',
};

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { status: res.status, message: data.message || 'Có lỗi xảy ra.' };
  }
  return data;
}

export const API = {
  auth: {
    dangKy: (body) => apiFetch('/auth/dang-ky', { method: 'POST', body: JSON.stringify(body) }),
    dangNhap: (body) => apiFetch('/auth/dang-nhap', { method: 'POST', body: JSON.stringify(body) }),
    layToi: () => apiFetch('/auth/toi'),
    capNhat: (body) => apiFetch('/auth/cap-nhat', { method: 'PUT', body: JSON.stringify(body) }),
    doiMK: (body) => apiFetch('/auth/doi-mat-khau', { method: 'PUT', body: JSON.stringify(body) }),
  },
  san: {
    danhSach: (q = '') => apiFetch('/san' + q),
    chiTiet: (id) => apiFetch(`/san/${id}`),
    lichTrong: (id, ng) => apiFetch(`/san/${id}/lich-trong?ngay=${ng}`),
    tatCa: () => apiFetch('/san/admin/tat-ca'),
    them: (body) => apiFetch('/san', { method: 'POST', body: JSON.stringify(body) }),
    capNhat: (id, body) => apiFetch(`/san/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    doiTrangThai: (id, trang_thai) =>
      apiFetch(`/san/${id}/trang-thai`, { method: 'PATCH', body: JSON.stringify({ trang_thai }) }),
  },
  datSan: {
    dat: (body) => apiFetch('/dat-san', { method: 'POST', body: JSON.stringify(body) }),
    cuaToi: (q = '') => apiFetch('/dat-san/cua-toi' + q),
    chiTiet: (id) => apiFetch(`/dat-san/${id}`),
    huy: (id) => apiFetch(`/dat-san/${id}/huy`, { method: 'PUT' }),
    adminTatCa: (q = '') => apiFetch('/dat-san/admin/tat-ca' + q),
    adminTT: (id, trang_thai) =>
      apiFetch(`/dat-san/admin/${id}/trang-thai`, { method: 'PATCH', body: JSON.stringify({ trang_thai }) }),
  },
  thanhToan: {
    tao: (body) => apiFetch('/thanh-toan', { method: 'POST', body: JSON.stringify(body) }),
    theoDon: (id) => apiFetch(`/thanh-toan/don/${id}`),
  },
  admin: {
    dashboard: () => apiFetch('/admin/dashboard'),
    doanhThu: (q = '') => apiFetch('/admin/bao-cao/doanh-thu' + q),
    nguoiDung: (q = '') => apiFetch('/admin/nguoi-dung' + q),
    doiTTUser: (id, trang_thai) =>
      apiFetch(`/admin/nguoi-dung/${id}/trang-thai`, { method: 'PATCH', body: JSON.stringify({ trang_thai }) }),
  },
};
