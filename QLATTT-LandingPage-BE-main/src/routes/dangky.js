const express = require('express');
const router = express.Router();
const db = require('../db');
const sendMail = require('../utils/mailer');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────
// HELPER: escape HTML chống XSS
// ─────────────────────────────────────────────────────────────
const esc = (str) =>
  str?.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;') ?? '';

// ─────────────────────────────────────────────────────────────
// API 1: ĐĂNG KÝ
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    ho_ten,
    so_dien_thoai,
    email,
    san_pham,
    ngan_sach,
    thoi_gian_lien_he,
    ghi_chu
  } = req.body;

  // Lấy IP đúng cách (tránh spoofing)
  const ip = (req.headers['x-forwarded-for'] || '')
    .split(',')[0].trim() || req.socket.remoteAddress;

  // ── Validate ──
  if (!ho_ten || !so_dien_thoai) {
    db.query(
      `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
      ['thiếu thông tin', ip],
      (logErr) => { if (logErr) console.error('❌ LOG ERROR:', logErr.message); }
    );
    return res.status(400).json({
      success: false,
      message: 'Thiếu họ tên hoặc số điện thoại'
    });
  }

  // Validate email format nếu có
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email không hợp lệ'
    });
  }

  // ── Insert DB ──
  const sql = `
    INSERT INTO khach_hang
    (ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    ho_ten, so_dien_thoai, email,
    san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu
  ], async (err, result) => {

    if (err) {
      console.error('❌ DB ERROR:', err.message);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }

    // ── Trả về client ngay, gửi mail background ──
    res.json({ success: true, message: 'Đăng ký thành công' });

    // Log success
    db.query(
      `INSERT INTO log (khach_hang_id, hanh_dong, dia_chi_ip) VALUES (?, ?, ?)`,
      [result.insertId, 'đăng ký mới', ip],
      (logErr) => { if (logErr) console.error('❌ LOG ERROR:', logErr.message); }
    );

    // ── Mail Admin ──
    sendMail({
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      toName: 'Admin ECO Riverside',
      subject: `🔥 Khách mới: ${esc(ho_ten)}`,
      html: `
        <h3>Khách hàng mới đăng ký</h3>
        <p><b>Tên:</b> ${esc(ho_ten)}</p>
        <p><b>SĐT:</b> ${esc(so_dien_thoai)}</p>
        <p><b>Email:</b> ${email ? esc(email) : 'Không có'}</p>
        <p><b>Sản phẩm:</b> ${esc(san_pham || '')}</p>
        <p><b>Ngân sách:</b> ${esc(ngan_sach || '')}</p>
        <p><b>Thời gian liên hệ:</b> ${esc(thoi_gian_lien_he || '')}</p>
        <p><b>Ghi chú:</b> ${esc(ghi_chu || '')}</p>
        <p><b>IP:</b> ${esc(ip)}</p>
      `
    }).then(() => console.log('✅ ADMIN MAIL SENT'))
      .catch(err => console.error('❌ ADMIN MAIL ERROR:', err.message));

    // ── Mail Khách ──
    if (email) {
      sendMail({
        to: email,
        toName: ho_ten,
        subject: 'Cảm ơn bạn đã đăng ký - ECO Riverside',
        html: `
          <p>Xin chào <b>${esc(ho_ten)}</b>,</p>
          <p>Chúng tôi đã nhận được thông tin đăng ký của bạn.</p>
          <p>Đội ngũ tư vấn sẽ liên hệ sớm qua số <b>${esc(so_dien_thoai)}</b>.</p>
          <br/>
          <p>Trân trọng,<br/>ECO Riverside</p>
        `
      }).then(() => console.log('✅ CUSTOMER MAIL SENT'))
        .catch(err => console.error('❌ CUSTOMER MAIL ERROR:', err.message));
    }
  });
});

// ─────────────────────────────────────────────────────────────
// API LIST — thêm isAdmin
// ─────────────────────────────────────────────────────────────
router.get('/danh-sach', verifyToken, isAdmin, (req, res) => {
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
router.get('/:id', verifyToken, isAdmin, (req, res) => {
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