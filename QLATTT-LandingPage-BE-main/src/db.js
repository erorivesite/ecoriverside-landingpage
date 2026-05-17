require('dotenv').config();
const mysql = require('mysql2');

// Khởi tạo kết nối và gán vào biến 'db'
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Bắt buộc phải có khi dùng Aiven
  }
});

// Kiểm tra kết nối
db.connect(err => {
  if (err) {
    console.error('Lỗi kết nối database:', err.message);
    return;
  }
  console.log('Kết nối MySQL (Aiven) thành công!');
});

// Xuất biến 'db' ra để các file khác (như routes) có thể require và dùng
module.exports = db;