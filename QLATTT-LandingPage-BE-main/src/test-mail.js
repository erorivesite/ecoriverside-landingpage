require('dotenv').config({ path: '../.env' }); // Trỏ đúng về file .env
const nodemailer = require('nodemailer');

console.log("Đang thử đăng nhập vào email:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
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