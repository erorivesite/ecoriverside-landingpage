```
# ERO Rivesite - Backend API Server

Hệ thống Backend API cung cấp dịch vụ cho Landing Page ERO Rivesite và Admin Dashboard.
Sử dụng RESTful API, JWT authentication và bcrypt để mã hóa mật khẩu.

--------------------------------------------------

CÔNG NGHỆ SỬ DỤNG

- Runtime      : Node.js
- Framework    : Express.js
- Database     : MySQL (mysql2)
- Security     : jsonwebtoken, bcryptjs
- Others       : cors, dotenv

--------------------------------------------------

CẤU TRÚC THƯ MỤC

QLATTT-LandingPage-BE/
│
├── src/
│   ├── middlewares/
│   │   └── authMiddleware.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dangky.js
│   │   └── user.js
│   │
│   ├── db.js
│   └── server.js
│
├── .env
└── package.json

--------------------------------------------------

HƯỚNG DẪN CÀI ĐẶT

[1] Cài thư viện

    npm install

[2] Tạo file .env

    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=your_mysql_password
    DB_NAME=ero_rivesite
    JWT_SECRET=your_secret_key

[3] Tạo database

    CREATE DATABASE IF NOT EXISTS ero_rivesite;
    USE ero_rivesite;

    CREATE TABLE khach_hang (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ho_ten VARCHAR(100),
      so_dien_thoai VARCHAR(15),
      email VARCHAR(150),
      san_pham VARCHAR(100),
      ngan_sach VARCHAR(50),
      thoi_gian_lien_he VARCHAR(50),
      ghi_chu TEXT,
      thoi_gian_dang_ky DATETIME DEFAULT NOW()
    );

    CREATE TABLE log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      khach_hang_id INT,
      hanh_dong VARCHAR(100),
      dia_chi_ip VARCHAR(45),
      thoi_gian DATETIME DEFAULT NOW()
    );

    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      password VARCHAR(255),
      role ENUM('admin','staff'),
      created_at DATETIME DEFAULT NOW()
    );

    INSERT INTO users (username, password, role)
    VALUES ('admin', 'admin123', 'admin');

--------------------------------------------------

    node setupAdmin.js

[4] Chạy server

    node src/server.js

--------------------------------------------------

SERVER

    https://qlattt-landingpage-final.onrender.com
```
