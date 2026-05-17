document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('ero_token');
  const role  = localStorage.getItem('ero_role');
  const username = localStorage.getItem('ero_username');
  const API = 'https://ecoriverside-landingpage.onrender.com';

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── State ──
  let allCustomers = [];
  let pinnedIds    = JSON.parse(localStorage.getItem('pinned_ids') || '[]');
  let favIds       = JSON.parse(localStorage.getItem('fav_ids') || '[]');
  let sortField    = 'thoi_gian_dang_ky';
  let sortDir      = 'desc';

  // ── Toast ──
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
  }

  // ═══════════════════════════════
  // LOGIN PAGE
  // ═══════════════════════════════
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    if (token) window.location.href = 'dashboard.html';
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('username').value;
      const p = document.getElementById('password').value;
      const errorMsg = document.getElementById('errorMsg');
      const submitBtn = document.getElementById('submitBtn');
      errorMsg.style.display = 'none';
      submitBtn.textContent = 'Đang xử lý...';
      submitBtn.disabled = true;
      try {
        const res  = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('ero_token', data.token);
          localStorage.setItem('ero_role', data.user.role);
          localStorage.setItem('ero_username', data.user.username);
          window.location.href = 'dashboard.html';
        } else {
          errorMsg.textContent = data.message;
          errorMsg.style.display = 'block';
        }
      } catch { errorMsg.textContent = 'Lỗi kết nối máy chủ!'; errorMsg.style.display = 'block'; }
      finally { submitBtn.textContent = 'Đăng nhập'; submitBtn.disabled = false; }
    });
  }

  // ═══════════════════════════════
  // DASHBOARD PAGE
  // ═══════════════════════════════
  const dashboardPage = document.querySelector('.dashboard-page');
  if (!dashboardPage) return;

  if (!token) { alert('Chưa đăng nhập!'); window.location.href = 'login.html'; return; }

  document.getElementById('displayUsername').textContent = username;
  document.getElementById('displayRole').textContent = role === 'admin' ? 'Quản trị viên' : 'Nhân viên';

  if (role !== 'admin') {
    document.getElementById('navLog').style.display = 'none';
    document.getElementById('navUsers').style.display = 'none';
  } else {
    document.getElementById('navUsers').style.display = 'block';
  }

  // ── UTILS ──
  function handleAuthError(status, data) {
    if (status === 401 || status === 403) { alert(data.message); window.logout(); }
  }

  window.logout = () => {
    ['ero_token','ero_role','ero_username'].forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
  };

  window.switchTab = (tabName, el) => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const titles = { customers: 'Danh sách khách hàng', logs: 'Log Hệ thống', users: 'Quản lý nhân viên' };
    document.getElementById('pageTitle').textContent = titles[tabName];
    document.getElementById(`view-${tabName}`).classList.add('active');
    if (tabName === 'customers') renderTable(allCustomers.length ? allCustomers : null) || loadCustomers();
    if (tabName === 'logs')      loadLogs();
    if (tabName === 'users')     loadUsers();
  };

  window.closeModal = () => document.getElementById('commonModal').classList.remove('active');
  window.onclick    = (e) => { if (e.target === document.getElementById('commonModal')) closeModal(); };

  // ── PIN / FAV ──
  function savePins() { localStorage.setItem('pinned_ids', JSON.stringify(pinnedIds)); }
  function saveFavs() { localStorage.setItem('fav_ids',    JSON.stringify(favIds));    }

  window.togglePin = (id) => {
    pinnedIds = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [...pinnedIds, id];
    savePins(); applyFilters();
    document.getElementById('statPinned').textContent = pinnedIds.length;
    toast(pinnedIds.includes(id) ? '📌 Đã ghim' : 'Đã bỏ ghim');
  };

  window.toggleFav = (id) => {
    favIds = favIds.includes(id) ? favIds.filter(x => x !== id) : [...favIds, id];
    saveFavs(); applyFilters();
    document.getElementById('statFav').textContent = favIds.length;
    toast(favIds.includes(id) ? '❤️ Đã yêu thích' : 'Đã bỏ yêu thích');
  };

  // ── DELETE ──
  window.deleteCustomer = async (id, name) => {
    if (!confirm(`Xoá khách hàng "${name}"?\nHành động này không thể hoàn tác!`)) return;
    try {
      const res  = await fetch(`${API}/api/dang-ky/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      handleAuthError(res.status, data);
      if (data.success) {
        allCustomers = allCustomers.filter(c => c.id !== id);
        applyFilters();
        toast('🗑 Đã xoá khách hàng');
      } else { alert('Lỗi: ' + data.message); }
    } catch { alert('Lỗi kết nối máy chủ'); }
  };

  // ── SORT ──
  window.sortBy = (field) => {
    if (sortField === field) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
    else { sortField = field; sortDir = 'desc'; }
    document.querySelectorAll('[id^="sort-"]').forEach(el => el.textContent = '');
    document.getElementById(`sort-${field}`).textContent = sortDir === 'asc' ? ' ▲' : ' ▼';
    applyFilters();
  };

  // ── FILTERS ──
  window.applyFilters = () => {
    const search  = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const product = document.getElementById('filterProduct')?.value || '';
    const budget  = document.getElementById('filterBudget')?.value || '';
    const dateF   = document.getElementById('filterDate')?.value || '';
    const flagF   = document.getElementById('filterFlag')?.value || '';
    const now     = new Date();

    let data = [...allCustomers];

    if (search)  data = data.filter(c => (c.ho_ten||'').toLowerCase().includes(search) || (c.so_dien_thoai||'').includes(search) || (c.email||'').toLowerCase().includes(search));
    if (product) data = data.filter(c => (c.san_pham||'') === product);
    if (budget)  data = data.filter(c => (c.ngan_sach||'') === budget);
    if (dateF) {
      const cutoff = new Date(now);
      if (dateF === 'today') cutoff.setHours(0,0,0,0);
      else if (dateF === 'week')  cutoff.setDate(now.getDate() - 7);
      else if (dateF === 'month') cutoff.setDate(now.getDate() - 30);
      data = data.filter(c => new Date(c.thoi_gian_dang_ky) >= cutoff);
    }
    if (flagF === 'pinned') data = data.filter(c => pinnedIds.includes(c.id));
    if (flagF === 'fav')    data = data.filter(c => favIds.includes(c.id));

    // sort: pinned lên đầu, rồi theo field
    data.sort((a, b) => {
      const ap = pinnedIds.includes(a.id) ? -1 : 0;
      const bp = pinnedIds.includes(b.id) ? -1 : 0;
      if (ap !== bp) return ap - bp;
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    renderTable(data);
  };

  window.resetFilters = () => {
    ['searchInput','filterProduct','filterBudget','filterDate','filterFlag'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    applyFilters();
  };

  // ── RENDER TABLE ──
  function renderTable(data) {
    const tbody = document.getElementById('customerTableBody');
    const empty = document.getElementById('emptyState');
    if (!data || !data.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = data.map(c => {
      const date    = new Date(c.thoi_gian_dang_ky).toLocaleString('vi-VN');
      const isPinned = pinnedIds.includes(c.id);
      const isFav    = favIds.includes(c.id);
      const budgetBadge = c.ngan_sach
        ? `<span class="badge ${c.ngan_sach.includes('Trên') ? 'badge-gold' : c.ngan_sach.includes('5 –') ? 'badge-green' : 'badge-blue'}">${c.ngan_sach}</span>`
        : '<span style="color:#bbb">—</span>';

      return `<tr style="${isPinned ? 'background:#fffde7;' : ''}">
        <td style="padding:8px 8px 8px 16px">
          ${isPinned ? '<span title="Đã ghim" style="color:#C9A84C;font-size:16px;">📌</span>' : ''}
          ${isFav    ? '<span title="Yêu thích" style="color:#e53935;font-size:15px;">❤️</span>' : ''}
        </td>
        <td style="color:#888;font-size:12px;">${date}</td>
        <td style="font-weight:600;color:#0B1628;">${c.ho_ten}</td>
        <td><a href="tel:${c.so_dien_thoai}" style="color:#1565c0;text-decoration:none;">${c.so_dien_thoai}</a></td>
        <td>${c.san_pham || '<span style="color:#bbb">—</span>'}</td>
        <td>${budgetBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon ${isPinned ? 'active-pin' : ''}" onclick="togglePin(${c.id})" title="${isPinned ? 'Bỏ ghim' : 'Ghim'}">📌</button>
            <button class="btn-icon ${isFav ? 'active-fav' : ''}" onclick="toggleFav(${c.id})" title="${isFav ? 'Bỏ yêu thích' : 'Yêu thích'}">❤️</button>
            <button class="btn btn-outline btn-small" onclick="viewCustomerDetails(${c.id})">Chi tiết</button>
            <button class="btn btn-danger btn-small" onclick="deleteCustomer(${c.id}, '${c.ho_ten.replace(/'/g,"\\'")}')">Xoá</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ── LOAD CUSTOMERS ──
  async function loadCustomers() {
    try {
      const res  = await fetch(`${API}/api/dang-ky/danh-sach`, { headers: authHeaders });
      const data = await res.json();
      handleAuthError(res.status, data);
      allCustomers = data.data || [];

      // Stats
      const today = new Date(); today.setHours(0,0,0,0);
      document.getElementById('statTotal').textContent = allCustomers.length;
      document.getElementById('statToday').textContent = allCustomers.filter(c => new Date(c.thoi_gian_dang_ky) >= today).length;
      document.getElementById('statPinned').textContent = pinnedIds.length;
      document.getElementById('statFav').textContent    = favIds.length;

      applyFilters();
    } catch (err) { console.error(err); }
  }

  // ── CUSTOMER DETAIL MODAL ──
  window.viewCustomerDetails = async (id) => {
    try {
      const res  = await fetch(`${API}/api/dang-ky/${id}`, { headers: authHeaders });
      const data = await res.json();
      handleAuthError(res.status, data);
      if (!data.success) return;
      const c    = data.data;
      const date = new Date(c.thoi_gian_dang_ky).toLocaleString('vi-VN');
      document.getElementById('modalTitle').textContent = 'Chi tiết khách hàng';
      document.getElementById('modalBody').innerHTML = `
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">Họ và tên</span><span class="detail-value">${c.ho_ten}</span></div>
          <div class="detail-item"><span class="detail-label">Số điện thoại</span><span class="detail-value"><a href="tel:${c.so_dien_thoai}" style="color:#1565c0">${c.so_dien_thoai}</a></span></div>
          <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${c.email ? `<a href="mailto:${c.email}" style="color:#1565c0">${c.email}</a>` : 'Không có'}</span></div>
          <div class="detail-item"><span class="detail-label">Sản phẩm</span><span class="detail-value">${c.san_pham || '—'}</span></div>
          <div class="detail-item"><span class="detail-label">Ngân sách</span><span class="detail-value">${c.ngan_sach || '—'}</span></div>
          <div class="detail-item"><span class="detail-label">Thời gian liên hệ</span><span class="detail-value">${c.thoi_gian_lien_he || 'Bất kỳ lúc nào'}</span></div>
          <div class="detail-item"><span class="detail-label">Ghi chú</span><div class="detail-value note">${c.ghi_chu || 'Không có'}</div></div>
          <div class="detail-item"><span class="detail-label">Thời gian đăng ký</span><span class="detail-value">${date}</span></div>
        </div>`;
      document.getElementById('modalFooter') && (document.getElementById('modalFooter').innerHTML = '');
      document.getElementById('commonModal').classList.add('active');
    } catch { alert('Không thể tải chi tiết'); }
  };

  // ── EXPORT CSV ──
  window.exportCSV = () => {
    if (!allCustomers.length) return toast('Không có dữ liệu');
    const headers = ['ID','Họ tên','SĐT','Email','Sản phẩm','Ngân sách','Thời gian liên hệ','Ghi chú','Thời gian đăng ký'];
    const rows = allCustomers.map(c => [
      c.id, c.ho_ten, c.so_dien_thoai, c.email||'',
      c.san_pham||'', c.ngan_sach||'', c.thoi_gian_lien_he||'',
      (c.ghi_chu||'').replace(/,/g,' '),
      new Date(c.thoi_gian_dang_ky).toLocaleString('vi-VN')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = `khachhang_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast('✅ Đã xuất CSV');
  };

  // ── LOGS ──
  async function loadLogs() {
    if (role !== 'admin') return;
    try {
      const res  = await fetch(`${API}/api/dang-ky/log`, { headers: authHeaders });
      const data = await res.json();
      handleAuthError(res.status, data);
      const tbody = document.getElementById('logTableBody');
      tbody.innerHTML = '';
      if (!data.data?.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">Chưa có log</td></tr>'; return; }
      data.data.forEach(item => {
        const date  = new Date(item.thoi_gian).toLocaleString('vi-VN');
        const color = item.hanh_dong.includes('thất bại') ? '#c62828' : '#2e7d32';
        tbody.innerHTML += `<tr>
          <td style="color:#888;font-size:12px">${date}</td>
          <td style="color:${color};font-weight:500">${item.hanh_dong}</td>
          <td>${item.ho_ten || '—'}</td>
          <td>${item.so_dien_thoai || '—'}</td>
          <td><button class="btn btn-outline btn-small" onclick="viewLogDetails(${item.id})">Chi tiết</button></td>
        </tr>`;
      });
      window._logsCache = data.data;
    } catch (err) { console.error(err); }
  }

  window.viewLogDetails = (id) => {
    const logEntry = (window._logsCache || []).find(l => l.id === id);
    if (!logEntry) return;
    const date = new Date(logEntry.thoi_gian).toLocaleString('vi-VN');
    document.getElementById('modalTitle').textContent = 'Chi tiết Log';
    document.getElementById('modalBody').innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span class="detail-label">Thời gian</span><span class="detail-value">${date}</span></div>
        <div class="detail-item"><span class="detail-label">Hành động</span><span class="detail-value">${logEntry.hanh_dong}</span></div>
        <div class="detail-item"><span class="detail-label">Địa chỉ IP</span><span class="detail-value">${logEntry.dia_chi_ip}</span></div>
        <div class="detail-item"><span class="detail-label">Khách hàng</span><span class="detail-value">${logEntry.ho_ten || '—'}</span></div>
        <div class="detail-item"><span class="detail-label">SĐT</span><span class="detail-value">${logEntry.so_dien_thoai || '—'}</span></div>
      </div>`;
    document.getElementById('commonModal').classList.add('active');
  };

  // ── USERS ──
  async function loadUsers() {
    if (role !== 'admin') return;
    try {
      const res  = await fetch(`${API}/api/users`, { headers: authHeaders });
      const data = await res.json();
      handleAuthError(res.status, data);
      const tbody = document.getElementById('userTableBody');
      tbody.innerHTML = '';
      if (!data.data?.length) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#888">Chưa có nhân viên</td></tr>'; return; }
      data.data.forEach(item => {
        const date      = new Date(item.created_at).toLocaleDateString('vi-VN');
        const roleBadge = item.role === 'admin' ? '<strong style="color:#C9A84C">Admin</strong>' : 'Nhân viên';
        const deleteBtn = item.username !== username
          ? `<button class="btn btn-danger btn-small" onclick="deleteUser(${item.id})">Xoá</button>`
          : '<span style="color:#888;font-size:12px">Đang online</span>';
        tbody.innerHTML += `<tr>
          <td style="color:#888;font-size:13px">${date}</td>
          <td><b>${item.username}</b></td>
          <td>${roleBadge}</td>
          <td>${deleteBtn}</td>
        </tr>`;
      });
    } catch (err) { console.error(err); }
  }

  document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('newUsername').value;
    const p = document.getElementById('newPassword').value;
    const r = document.getElementById('newRole').value;
    try {
      const res  = await fetch(`${API}/api/users`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ username: u, password: p, role: r }) });
      const data = await res.json();
      handleAuthError(res.status, data);
      if (data.success) { toast('✅ Tạo tài khoản thành công'); document.getElementById('addUserForm').reset(); loadUsers(); }
      else { alert('Lỗi: ' + data.message); }
    } catch { alert('Lỗi kết nối'); }
  });

  window.deleteUser = async (id) => {
    if (!confirm('Xoá vĩnh viễn tài khoản này?')) return;
    try {
      const res  = await fetch(`${API}/api/users/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      handleAuthError(res.status, data);
      if (data.success) { toast('🗑 Đã xoá'); loadUsers(); }
      else { alert('Lỗi: ' + data.message); }
    } catch { alert('Lỗi kết nối'); }
  };

  // ── INIT ──
  loadCustomers();
});