```
# ERO Rivesite - Landing Page & Admin Dashboard

Frontend cho dự án khu đô thị sinh thái ERO Rivesite.
Bao gồm 2 phần:
- Landing Page cho khách hàng
- Admin Dashboard cho nhân viên quản lý

--------------------------------------------------

CÔNG NGHỆ SỬ DỤNG

- Core        : HTML5, CSS3, JavaScript (Vanilla)
- Font        : Cormorant Garamond (Heading), DM Sans (Body)
- Kiến trúc   : Tách Public UI và Admin UI (có JWT bảo vệ)

--------------------------------------------------

CẤU TRÚC THƯ MỤC

QLATTT-LandingPage/
│
├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       └── main.js
│
├── admin/
│   ├── assets/
│   │   ├── admin.css
│   │   └── admin.js
│   │
│   ├── login.html
│   └── dashboard.html
│
└── index.html

--------------------------------------------------

HƯỚNG DẪN SỬ DỤNG

Không cần build.

Chạy bằng cách:
    - Mở file index.html bằng trình duyệt
    - Hoặc dùng Live Server (VS Code)

Truy cập trang admin:
    /admin/login.html

--------------------------------------------------

TÀI KHOẢN ADMIN (DEV)

Username:
    admin

Password:
    admin123

Ghi chú:
    - Hệ thống tự phân quyền admin / staff
    - Admin có thể xem log và quản lý nhân sự

--------------------------------------------------

CẤU HÌNH API

Frontend đang gọi API tại:

    https://qlattt-landingpage-final.onrender.com

--------------------------------------------------

KHI DEPLOY PRODUCTION

Cần thay toàn bộ:

    https://qlattt-landingpage-final.onrender.com

Thành domain backend thực tế, ví dụ:

    https://api.erorivesite.vn

Có thể dùng Find & Replace trong VS Code để thay nhanh.
```