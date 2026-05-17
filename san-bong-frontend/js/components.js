// js/components.js
// Render shared components: navbar, footer

function renderNavbar(activePage = '') {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="navbar-logo">
      <div class="logo-icon">⚽</div>
      <a href="/index.html">SânBóng<span style="color:var(--green-500)">Pro</span></a>
    </div>

    <nav class="navbar-links">
      <a href="/index.html"            class="${activePage==='home'?'active':''}">Trang chủ</a>
      <a href="/pages/san-bong.html"   class="${activePage==='san'?'active':''}">Sân bóng</a>
      <a href="/pages/lich-su.html"    class="${activePage==='lichsu'?'active':''}">Lịch sử đặt</a>
    </nav>

    <div class="navbar-actions">
      <a href="/pages/login.html" id="nav-login" class="btn btn-primary btn-sm" style="display:none">Đăng nhập</a>

      <div id="nav-user" class="navbar-user" style="display:none">
        <div class="user-avatar" id="nav-avatar">U</div>
        <span class="user-name" id="nav-name"></span>
        <button onclick="logout()" class="btn btn-ghost btn-sm">Đăng xuất</button>
      </div>
    </div>
  `;

  renderNavbarUser();
}

function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;
  el.innerHTML = `
    <div style="background:var(--slate-900); color:rgba(255,255,255,.5); text-align:center; padding:1.5rem; font-size:13px; margin-top:4rem;">
      © 2024 SânBóngPro · Hệ thống quản lý sân bóng · PTIT
    </div>`;
}
