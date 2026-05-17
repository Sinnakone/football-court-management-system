// js/utils.js
// Tiện ích dùng chung: toast, modal, format tiền, ngày, trạng thái

// ── Toast notification ─────────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]||'✓'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── Modal ──────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function createModal(id, title, bodyHTML, footerHTML = '') {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = id;
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" onclick="closeModal('${id}')">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(id); });
  document.body.appendChild(overlay);
}

// ── Format helpers ─────────────────────────────────────────────
const fmt = {
  tien: (n) => Number(n).toLocaleString('vi-VN') + ' đ',
  ngay: (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  },
  gio: (t) => t ? String(t).substring(0,5) : '—',
  trangThaiDon: (tt) => {
    const map = {
      cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'status-cho_xac_nhan' },
      da_xac_nhan:  { label: 'Đã xác nhận',  cls: 'status-da_xac_nhan'  },
      hoan_thanh:   { label: 'Hoàn thành',   cls: 'status-hoan_thanh'   },
      da_huy:       { label: 'Đã hủy',       cls: 'status-da_huy'       },
    };
    const s = map[tt] || { label: tt, cls: 'badge-slate' };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },
  loaiSan: (l) => {
    const map = { '5 nguoi': '⚽ 5 người', '7 nguoi': '⚽ 7 người', '11 nguoi': '⚽ 11 người' };
    return map[l] || l;
  },
  avatarText: (name) => name ? name.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase() : 'U',
};

// ── Redirect if not logged in ──────────────────────────────────
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    showToast('Vui lòng đăng nhập để tiếp tục.', 'error');
    setTimeout(() => window.location.href = '/pages/login.html', 800);
    return false;
  }
  return true;
}
function requireAdmin() {
  if (!Auth.isAdmin()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// ── Render navbar user info ────────────────────────────────────
function renderNavbarUser() {
  const user = Auth.getUser();
  const loginBtn  = document.getElementById('nav-login');
  const userBlock = document.getElementById('nav-user');
  const userAvatar= document.getElementById('nav-avatar');
  const userName  = document.getElementById('nav-name');

  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (userBlock) userBlock.style.display = 'flex';
    if (userAvatar) userAvatar.textContent = fmt.avatarText(user.ho_ten);
    if (userName)   userName.textContent   = user.ho_ten;
  } else {
    if (loginBtn)  loginBtn.style.display  = 'inline-flex';
    if (userBlock) userBlock.style.display = 'none';
  }
}

// ── Logout ─────────────────────────────────────────────────────
function logout() {
  Auth.clear();
  window.location.href = '/index.html';
}
