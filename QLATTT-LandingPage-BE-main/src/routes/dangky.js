const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────
// CẤU HÌNH GỬI MAIL
// ─────────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// Test SMTP khi server start
transporter.verify((err, success) => {
  if (err) {
    console.log("❌ SMTP VERIFY ERROR:", err);
  } else {
    console.log("✅ SMTP READY - Gmail connected");
  }
});

// ─────────────────────────────────────────────────────────────────────────
// API 1: NHẬN FORM ĐĂNG KÝ
// POST /api/dang-ky
// ─────────────────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const {
    ho_ten,
    so_dien_thoai,
    email,
    san_pham,
    ngan_sach,
    thoi_gian_lien_he,
    ghi_chu
  } = req.body;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Validate required fields
  if (!ho_ten || !so_dien_thoai) {
    db.query(
      `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
      ['đăng ký thất bại — thiếu thông tin', ip]
    );

    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập họ tên và số điện thoại'
    });
  }

  // Validate phone VN
  const sdtRegex = /^(0|\+84)[0-9]{8,10}$/;

  if (!sdtRegex.test(so_dien_thoai)) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại không đúng định dạng'
    });
  }

  // Insert DB
  const sql = `
    INSERT INTO khach_hang
    (ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      ho_ten,
      so_dien_thoai,
      email,
      san_pham,
      ngan_sach,
      thoi_gian_lien_he,
      ghi_chu
    ],
    (err, result) => {

      if (err) {
        console.log('❌ Lỗi lưu khách hàng:', err);

        db.query(
          `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
          ['đăng ký thất bại — lỗi server', ip]
        );

        return res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }

      // ───────────────────────────────────────────────────────────────────
      // MAIL ADMIN
      // ───────────────────────────────────────────────────────────────────
      const adminMailOptions = {
        from: `"ECO Riverside" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `🔥 Khách hàng mới: ${ho_ten}`,
        html: `
          <div style="font-family: Arial; padding:20px;">
            <h2 style="color:#0B1628;">Khách hàng mới đăng ký</h2>

            <p><b>Họ tên:</b> ${ho_ten}</p>
            <p><b>SĐT:</b> ${so_dien_thoai}</p>
            <p><b>Email:</b> ${email || 'Không có'}</p>
            <p><b>Sản phẩm:</b> ${san_pham || 'Không chọn'}</p>
            <p><b>Ngân sách:</b> ${ngan_sach || 'Không chọn'}</p>
            <p><b>Thời gian liên hệ:</b> ${thoi_gian_lien_he || 'Không có'}</p>
            <p><b>Ghi chú:</b> ${ghi_chu || 'Không có'}</p>

            <hr />
            <small>Landing Page ECO Riverside</small>
          </div>
        `
      };

      // ───────────────────────────────────────────────────────────────────
      // MAIL KHÁCH HÀNG
      // ───────────────────────────────────────────────────────────────────
      const customerMailOptions = {
        from: `"ECO Riverside" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Cảm ơn bạn đã đăng ký tư vấn ECO Riverside',
        html: `
          <div style="max-width:600px;margin:auto;border:1px solid #eee;font-family:sans-serif;">
            
            <div style="background:#0B1628;color:#C9A84C;padding:20px;text-align:center;">
              <h1>ECO RIVERSIDE</h1>
            </div>

            <div style="padding:30px;">
              <p>Xin chào <b>${ho_ten}</b>,</p>

              <p>
                Chúng tôi đã nhận được thông tin đăng ký tư vấn của bạn.
              </p>

              <p>
                Chuyên viên sẽ liên hệ với bạn qua số
                <b>${so_dien_thoai}</b>
                trong thời gian sớm nhất.
              </p>

              <br />

              <p>Trân trọng,</p>
              <p><b>Đội ngũ ECO Riverside</b></p>
            </div>
          </div>
        `
      };

      // ───────────────────────────────────────────────────────────────────
      // GỬI MAIL ADMIN
      // ───────────────────────────────────────────────────────────────────
      transporter.sendMail(adminMailOptions, (mailErr, info) => {
        if (mailErr) {
          console.log("❌ Lỗi mail admin:", mailErr);
        } else {
          console.log("✅ Mail admin sent:", info.response);
        }
      });

      // ───────────────────────────────────────────────────────────────────
      // GỬI MAIL KHÁCH
      // ───────────────────────────────────────────────────────────────────
      if (email) {
        transporter.sendMail(customerMailOptions, (mailErr, info) => {
          if (mailErr) {
            console.log("❌ Lỗi mail khách:", mailErr);
          } else {
            console.log("✅ Mail khách sent:", info.response);
          }
        });
      }

      // ───────────────────────────────────────────────────────────────────
      // GHI LOG
      // ───────────────────────────────────────────────────────────────────
      db.query(
        `INSERT INTO log (khach_hang_id, hanh_dong, dia_chi_ip)
         VALUES (?, ?, ?)`,
        [result.insertId, 'đăng ký mới', ip]
      );

      return res.json({
        success: true,
        message: 'Đăng ký thành công'
      });
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────
// API 2: DANH SÁCH KHÁCH HÀNG
// ─────────────────────────────────────────────────────────────────────────
router.get('/danh-sach', verifyToken, (req, res) => {

  db.query(
    `SELECT * FROM khach_hang ORDER BY thoi_gian_dang_ky DESC`,
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }

      return res.json({
        success: true,
        data: rows
      });
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────
// API 3: LOG HỆ THỐNG
// ─────────────────────────────────────────────────────────────────────────
router.get('/log', verifyToken, isAdmin, (req, res) => {

  db.query(
    `
    SELECT log.*, khach_hang.ho_ten, khach_hang.so_dien_thoai
    FROM log
    LEFT JOIN khach_hang
    ON log.khach_hang_id = khach_hang.id
    ORDER BY log.thoi_gian DESC
    `,
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }

      return res.json({
        success: true,
        data: rows
      });
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────
// API 4: CHI TIẾT KHÁCH HÀNG
// ─────────────────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {

  db.query(
    `SELECT * FROM khach_hang WHERE id = ?`,
    [req.params.id],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng'
        });
      }

      return res.json({
        success: true,
        data: rows[0]
      });
    }
  );
});

module.exports = router;