export const fmt = {
  tien: (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ',
  ngay: (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  },
  gio: (t) => (t ? String(t).substring(0, 5) : '—'),
  loaiSan: (l) => ({ '5 nguoi': '⚽ 5 người', '7 nguoi': '⚽ 7 người', '11 nguoi': '⚽ 11 người' })[l] || l,
  avatarText: (name) => (name ? name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() : 'U'),
};

export function StatusBadge({ value }) {
  const map = {
    cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'status-cho_xac_nhan' },
    da_xac_nhan: { label: 'Đã xác nhận', cls: 'status-da_xac_nhan' },
    hoan_thanh: { label: 'Hoàn thành', cls: 'status-hoan_thanh' },
    da_huy: { label: 'Đã hủy', cls: 'status-da_huy' },
  };
  const s = map[value] || { label: value, cls: 'badge-slate' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function monthStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}
