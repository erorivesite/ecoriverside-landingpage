require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

console.log("Đang thử đăng nhập vào email:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ LỖI ĐĂNG NHẬP GMAIL:");
    console.log(error.message);
  } else {
    console.log("✅ KẾT NỐI GMAIL THÀNH CÔNG! Sẵn sàng gửi mail.");
  }
});

module.exports = transporter;