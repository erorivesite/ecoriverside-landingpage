require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/db'); // Đường dẫn trỏ vào file db.js của bạn

// 1. Đọc mật khẩu từ biến môi trường ADMIN_INITIAL_PASSWORD
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
if (!adminPassword) {
  console.error('❌ Cần đặt biến môi trường ADMIN_INITIAL_PASSWORD trước khi chạy script này');
  process.exit(1);
}
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

// 2. Cập nhật vào cơ sở dữ liệu
db.query(
  'UPDATE users SET password = ? WHERE username = "admin"', 
  [hashedPassword], 
  (err, result) => {
    if (err) {
      console.error('Lỗi cập nhật:', err.message);
    } else {
      console.log('✅ Đã cập nhật mật khẩu thành công!');
    }
    process.exit(); // Tắt script sau khi chạy xong
  }
);