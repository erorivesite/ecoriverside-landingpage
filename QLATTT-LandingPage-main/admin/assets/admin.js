document.addEventListener('DOMContentLoaded', () => {
  // Lấy thông tin từ localStorage
  const token = localStorage.getItem('ero_token');
  const role = localStorage.getItem('ero_role');
  const username = localStorage.getItem('ero_username');

  // Cấu hình headers đính kèm Token cho mọi request gọi API bảo mật
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // =========================================
  // LOGIC CHO TRANG LOGIN
  // =========================================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // Nếu đã đăng nhập rồi, đá thẳng vào dashboard
    if (token) window.location.href = 'dashboard.html';

    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const usernameInput = document.getElementById('username').value;
      const passwordInput = document.getElementById('password').value;
      const errorMsg = document.getElementById('errorMsg');
      const submitBtn = document.getElementById('submitBtn');

      errorMsg.style.display = 'none';
      submitBtn.textContent = 'Đang xử lý...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('https://qlattt-landingpage-final.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        const data = await response.json();

        if (data.success) {
          localStorage.setItem('ero_token', data.token);
          localStorage.setItem('ero_role', data.user.role);
          localStorage.setItem('ero_username', data.user.username);
          window.location.href = 'dashboard.html';
        } else {
          errorMsg.textContent = data.message;
          errorMsg.style.display = 'block';
        }
      } catch (error) {
        errorMsg.textContent = 'Lỗi kết nối đến máy chủ!';
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.textContent = 'Đăng nhập';
        submitBtn.disabled = false;
      }
    });
  }

  // =========================================
  // LOGIC CHO TRANG DASHBOARD
  // =========================================
  const dashboardPage = document.querySelector('.dashboard-page');
  if (dashboardPage) {
    // Bảo vệ trang: Nếu chưa có Token thì đá ra trang login
    if (!token) {
      alert('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn!');
      window.location.href = 'login.html';
      return;
    }

    // 1. Phân quyền giao diện dựa trên Role
    document.getElementById('displayUsername').textContent = username;
    document.getElementById('displayRole').textContent = role === 'admin' ? 'Quản trị viên' : 'Nhân viên';

    if (role !== 'admin') {
      // Giấu các chức năng chỉ dành cho Admin
      document.getElementById('navLog').style.display = 'none';
      document.getElementById('navUsers').style.display = 'none';
    } else {
      // Hiện các chức năng Admin
      document.getElementById('navUsers').style.display = 'block';
    }

    // --- CÁC HÀM CÔNG CỤ (GLOBAL FUNCTIONS) ---
    
    // Đăng xuất
    window.logout = function() {
      localStorage.removeItem('ero_token');
      localStorage.removeItem('ero_role');
      localStorage.removeItem('ero_username');
      window.location.href = 'login.html';
    };

    // Chuyển Tab
    window.switchTab = function(tabName) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      event.target.classList.add('active');

      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
      
      if (tabName === 'customers') {
        document.getElementById('view-customers').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Danh sách khách hàng';
        loadCustomers();
      } else if (tabName === 'logs') {
        document.getElementById('view-logs').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Log Hệ thống';
        loadLogs();
      } else if (tabName === 'users') {
        document.getElementById('view-users').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Quản lý nhân viên';
        loadUsers();
      }
    };

    // Hàm tiện ích: Đóng Modal
    window.closeModal = function() {
      document.getElementById('commonModal').classList.remove('active');
    }

    // Đóng Modal khi click ra ngoài vùng Popup
    window.onclick = function(event) {
      if (event.target == document.getElementById('commonModal')) closeModal();
    }

    // --- LOGIC GỌI API & HIỂN THỊ DỮ LIỆU ---

    // Hàm tiện ích: Xử lý lỗi Token hết hạn hoặc sai quyền (401, 403)
    function handleAuthError(status, data) {
      if (status === 401 || status === 403) {
        alert(data.message);
        window.logout();
      }
    }

    // 1. API: Lấy danh sách Khách hàng
    async function loadCustomers() {
      try {
        const res = await fetch('https://qlattt-landingpage-final.onrender.com/api/dang-ky/danh-sach', { headers: authHeaders });
        const data = await res.json();
        
        handleAuthError(res.status, data);
        
        const tbody = document.getElementById('customerTableBody');
        tbody.innerHTML = '';
        if (data.data && data.data.length > 0) {
          data.data.forEach(item => {
            const date = new Date(item.thoi_gian_dang_ky).toLocaleString('vi-VN');
            tbody.innerHTML += `
              <tr>
                <td>${date}</td>
                <td style="font-weight: 500; color: #0B1628;">${item.ho_ten}</td>
                <td>${item.so_dien_thoai}</td>
                <td>${item.san_pham || '-'}</td>
                <td>${item.ngan_sach || '-'}</td>
                <td><button class="btn btn-outline btn-small" onclick="viewCustomerDetails(${item.id})">Chi tiết</button></td>
              </tr>
            `;
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có khách hàng nào đăng ký.</td></tr>';
        }
      } catch (err) { console.error(err); }
    }

    // 2. API: Xem chi tiết Khách hàng nảy ra Popup (Modal)
    window.viewCustomerDetails = async function(id) {
      try {
        // Gọi API lấy chi tiết khách hàng qua ID (Cần đính kèm Token)
        const res = await fetch(`https://qlattt-landingpage-final.onrender.com/api/dang-ky/${id}`, { headers: authHeaders });
        const data = await res.json();
        
        handleAuthError(res.status, data);

        if (data.success) {
          const c = data.data;
          const date = new Date(c.thoi_gian_dang_ky).toLocaleString('vi-VN');
          
          // Đổ dữ liệu vào Modal
          document.getElementById('modalTitle').textContent = 'Chi tiết khách hàng đăng ký';
          document.getElementById('modalBody').innerHTML = `
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Họ và tên</span><span class="detail-value">${c.ho_ten}</span></div>
              <div class="detail-item"><span class="detail-label">Số điện thoại</span><span class="detail-value">${c.so_dien_thoai}</span></div>
              <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${c.email || 'Không có'}</span></div>
              <div class="detail-item"><span class="detail-label">Sản phẩm</span><span class="detail-value">${c.san_pham || 'Không có'}</span></div>
              <div class="detail-item"><span class="detail-label">Ngân sách</span><span class="detail-value">${c.ngan_sach || 'Không có'}</span></div>
              <div class="detail-item"><span class="detail-label">Ưu tiên liên hệ</span><span class="detail-value">${c.thoi_gian_lien_he || 'Bất kỳ lúc nào'}</span></div>
              <div class="detail-item"><span class="detail-label">Ghi chú</span><div class="detail-value note">${c.ghi_chu || 'Không có ghi chú thêm.'}</div></div>
              <div class="detail-item"><span class="detail-label">Thời gian đăng ký</span><span class="detail-value">${date}</span></div>
            </div>
          `;
          // Hiện Modal
          document.getElementById('commonModal').classList.add('active');
        }
      } catch (err) { alert('Lỗi: ' + 'Không thể lấy thông tin chi tiết khách hàng'); }
    }

    // 3. API: Lấy Log hệ thống (CHỈ ADMIN)
    async function loadLogs() {
      if (role !== 'admin') return; // Chặn ở UI cho chắc
      try {
        const res = await fetch('https://qlattt-landingpage-final.onrender.com/api/dang-ky/log', { headers: authHeaders });
        const data = await res.json();
        
        handleAuthError(res.status, data);

        const tbody = document.getElementById('logTableBody');
        tbody.innerHTML = '';
        if (data.data && data.data.length > 0) {
          data.data.forEach(item => {
            const date = new Date(item.thoi_gian).toLocaleString('vi-VN');
            const actionColor = item.hanh_dong.includes('thất bại') ? '#e74c3c' : '#27ae60';
            const logId = item.id;
            tbody.innerHTML += `
              <tr>
                <td>${date}</td>
                <td style="color: ${actionColor}; font-weight: 500;">${item.hanh_dong}</td>
                <td>${item.ho_ten || '-'}</td>
                <td>${item.so_dien_thoai || '-'}</td>
                <td><button class="btn btn-outline btn-small" onclick="viewLogDetails(${logId})">Chi tiết</button></td>
              </tr>
            `;
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có log hệ thống.</td></tr>';
        }
      } catch (err) { console.error(err); }
    }

    // 4. CHỨC NĂNG MỚI: Xem chi tiết Log nảy ra Popup
    window.viewLogDetails = async function(id) {
      if (role !== 'admin') return;
      try {
        const res = await fetch(`https://qlattt-landingpage-final.onrender.com/api/dang-ky/log`, { headers: authHeaders }); // Backend chưa có API log/:id nên ta lấy full log rồi filter
        const data = await res.json();
        handleAuthError(res.status, data);

        const logEntry = data.data.find(l => l.id === id);
        if (logEntry) {
          const date = new Date(logEntry.thoi_gian).toLocaleString('vi-VN');
          document.getElementById('modalTitle').textContent = 'Chi tiết Log hệ thống';
          document.getElementById('modalBody').innerHTML = `
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Thời gian</span><span class="detail-value">${date}</span></div>
              <div class="detail-item"><span class="detail-label">Hành động</span><span class="detail-value">${logEntry.hanh_dong}</span></div>
              <div class="detail-item"><span class="detail-label">Địa chỉ IP</span><span class="detail-value">${logEntry.dia_chi_ip}</span></div>
              <div class="detail-item"><span class="detail-label">Liên quan khách hàng</span><span class="detail-value">${logEntry.ho_ten || 'Không có'}</span></div>
              <div class="detail-item"><span class="detail-label">SĐT khách hàng</span><span class="detail-value">${logEntry.so_dien_thoai || 'Không có'}</span></div>
            </div>
          `;
          document.getElementById('commonModal').classList.add('active');
        }
      } catch (err) { alert('Lỗi lấy chi tiết log'); }
    }

    // 5. API: Lấy danh sách tài khoản User (CHỈ ADMIN)
    async function loadUsers() {
      if (role !== 'admin') return;
      try {
        const res = await fetch('https://qlattt-landingpage-final.onrender.com/api/users', { headers: authHeaders });
        const data = await res.json();
        
        handleAuthError(res.status, data);

        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        if (data.data && data.data.length > 0) {
          data.data.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString('vi-VN');
            const roleBadge = item.role === 'admin' ? '<strong style="color:#C9A84C">Admin</strong>' : 'Nhân viên';
            // Không cho xóa chính mình
            const deleteBtn = item.username !== username 
              ? `<button class="btn btn-danger btn-small" onclick="deleteUser(${item.id})">Xóa</button>` 
              : '<span style="color:#888; font-size:12px;">Đang online</span>';
            
            tbody.innerHTML += `
              <tr>
                <td>${date}</td>
                <td><b>${item.username}</b></td>
                <td>${roleBadge}</td>
                <td>${deleteBtn}</td>
              </tr>
            `;
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có nhân viên nào khác.</td></tr>';
        }
      } catch (err) { console.error(err); }
    }

    // 6. API: Thêm tài khoản nhân viên mới (ADD USER)
    document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('newUsername').value;
      const p = document.getElementById('newPassword').value;
      const r = document.getElementById('newRole').value;

      try {
        const res = await fetch('https://qlattt-landingpage-final.onrender.com/api/users', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ username: u, password: p, role: r })
        });
        const data = await res.json();
        
        handleAuthError(res.status, data);

        if(data.success) {
          alert('Đã tạo tài khoản nhân viên thành công!');
          document.getElementById('addUserForm').reset(); // Xóa sạch form
          loadUsers(); // Tải lại bảng nhân viên
        } else {
          alert("Lỗi: " + data.message);
        }
      } catch (err) { alert('Lỗi kết nối máy chủ khi tạo user'); }
    });

    // 7. API: Xóa tài khoản nhân viên
    window.deleteUser = async function(id) {
      if(!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân viên này không?')) return;
      try {
        const res = await fetch(`https://qlattt-landingpage-final.onrender.com/api/users/${id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        const data = await res.json();
        
        handleAuthError(res.status, data);

        if(data.success) {
          loadUsers();
        } else {
          alert("Lỗi: " + data.message);
        }
      } catch (err) { alert('Lỗi kết nối máy chủ khi xóa user'); }
    };


    // Mặc định load Tab đầu tiên khi vừa vào trang
    loadCustomers();
  }
});