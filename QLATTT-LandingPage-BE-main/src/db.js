require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  }
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Lỗi kết nối database:', err.message);
    return;
  }
  console.log('Kết nối MySQL (Railway) thành công!');
  connection.release();
});

module.exports = db;