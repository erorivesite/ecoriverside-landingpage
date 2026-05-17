const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────
// SMTP BREVO CONFIG
// ─────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // 587 = false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 30000,
  socketTimeout: 30000,
});

// Test SMTP khi server start
transporter.verify((err, success) => {
  if (err) {
    console.log("❌ SMTP ERROR:", err);
  } else {
    console.log("✅ SMTP READY - Brevo connected");
  }
});

// ─────────────────────────────────────────────────────────────
// API 1: ĐĂNG KÝ
// ─────────────────────────────────────────────────────────────
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

  // validate
  if (!ho_ten || !so_dien_thoai) {
    db.query(
      `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
      ['thiếu thông tin', ip]
    );

    return res.status(400).json({
      success: false,
      message: 'Thiếu họ tên hoặc số điện thoại'
    });
  }

  const sql = `
    INSERT INTO khach_hang
    (ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    ho_ten,
    so_dien_thoai,
    email,
    san_pham,
    ngan_sach,
    thoi_gian_lien_he,
    ghi_chu
  ], (err, result) => {

    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }

    // ─────────────────────────────────────────────
    // MAIL ADMIN
    // ─────────────────────────────────────────────
    const adminMail = {
      from: `"ECO Riverside" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `🔥 Khách mới: ${ho_ten}`,
      html: `
        <h3>Khách hàng mới</h3>
        <p><b>Tên:</b> ${ho_ten}</p>
        <p><b>SĐT:</b> ${so_dien_thoai}</p>
        <p><b>Email:</b> ${email || 'Không có'}</p>
        <p><b>Sản phẩm:</b> ${san_pham || ''}</p>
        <p><b>Ngân sách:</b> ${ngan_sach || ''}</p>
      `
    };

    // ─────────────────────────────────────────────
    // MAIL KHÁCH
    // ─────────────────────────────────────────────
    const customerMail = email ? {
      from: `"ECO Riverside" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Cảm ơn bạn đã đăng ký",
      html: `
        <p>Xin chào <b>${ho_ten}</b>,</p>
        <p>Chúng tôi đã nhận được thông tin của bạn.</p>
        <p>Sẽ liên hệ sớm qua số ${so_dien_thoai}</p>
      `
    } : null;

    // ─────────────────────────────────────────────
    // SEND MAIL ADMIN
    // ─────────────────────────────────────────────
    transporter.sendMail(adminMail, (err, info) => {
      if (err) {
        console.log("❌ ADMIN MAIL ERROR:", err.message);
      } else {
        console.log("✅ ADMIN MAIL SENT");
      }
    });

    // ─────────────────────────────────────────────
    // SEND MAIL CUSTOMER
    // ─────────────────────────────────────────────
    if (customerMail) {
      transporter.sendMail(customerMail, (err, info) => {
        if (err) {
          console.log("❌ CUSTOMER MAIL ERROR:", err.message);
        } else {
          console.log("✅ CUSTOMER MAIL SENT");
        }
      });
    }

    // log success
    db.query(
      `INSERT INTO log (khach_hang_id, hanh_dong, dia_chi_ip)
       VALUES (?, ?, ?)`,
      [result.insertId, 'đăng ký mới', ip]
    );

    return res.json({
      success: true,
      message: 'Đăng ký thành công'
    });
  });
});

// ─────────────────────────────────────────────────────────────
// API LIST
// ─────────────────────────────────────────────────────────────
router.get('/danh-sach', verifyToken, (req, res) => {
  db.query(
    `SELECT * FROM khach_hang ORDER BY id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, data: rows });
    }
  );
});

// ─────────────────────────────────────────────────────────────
// LOG
// ─────────────────────────────────────────────────────────────
router.get('/log', verifyToken, isAdmin, (req, res) => {
  db.query(
    `SELECT * FROM log ORDER BY id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, data: rows });
    }
  );
});

// ─────────────────────────────────────────────────────────────
// DETAIL
// ─────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  db.query(
    `SELECT * FROM khach_hang WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false });
      if (!rows.length) return res.status(404).json({ success: false });

      res.json({ success: true, data: rows[0] });
    }
  );
});

module.exports = router;