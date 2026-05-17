const express = require('express');
const router  = express.Router();
const db      = require('../db');
const nodemailer = require('nodemailer');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────
// 1. CẤU HÌNH GỬI MAIL (Sử dụng biến môi trường từ file .env)
// ─────────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────────────────────────────────────
// API 1: NHẬN FORM ĐĂNG KÝ (PUBLIC)
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

  // Kiểm tra thông tin bắt buộc
  if (!ho_ten || !so_dien_thoai) {
    db.query(
      `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
      ['đăng ký thất bại — thiếu thông tin', ip]
    );
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền họ tên và số điện thoại'
    });
  }

  // Kiểm tra số điện thoại đúng định dạng (Việt Nam)
  const sdtRegex = /^(0|\+84)[0-9]{8,10}$/;
  if (!sdtRegex.test(so_dien_thoai)) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại không đúng định dạng'
    });
  }

  // Lưu khách hàng vào database
  const sql = `
    INSERT INTO khach_hang 
      (ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu],
    (err, result) => {
      if (err) {
        console.log('Lỗi lưu khách hàng:', err.message);
        db.query(
          `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
          ['đăng ký thất bại — lỗi server', ip]
        );
        return res.status(500).json({
          success: false,
          message: 'Lỗi server, vui lòng thử lại'
        });
      }

      // ─────────────────────────────────────────────────────
      // 2. TỰ ĐỘNG GỬI MAIL (ADMIN & CUSTOMER)
      // ─────────────────────────────────────────────────────
      
      // Nội dung mail báo về cho Huy (Admin)
      const adminMailOptions = {
        from: `"Hệ thống ECO Riverside" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, 
        subject: `🔥 [THÔNG BÁO] Khách hàng mới: ${ho_ten}`,
        html: `
          <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
            <h2 style="color: #0B1628;">Bạn có khách hàng mới đăng ký!</h2>
            <hr>
            <p><b>Họ tên:</b> ${ho_ten}</p>
            <p><b>Số điện thoại:</b> ${so_dien_thoai}</p>
            <p><b>Email:</b> ${email || 'Không có'}</p>
            <p><b>Dự án quan tâm:</b> ${san_pham || 'Không chọn'}</p>
            <p><b>Ngân sách:</b> ${ngan_sach || 'Không chọn'}</p>
            <p><b>Ghi chú:</b> ${ghi_chu || 'Trống'}</p>
            <hr>
            <p style="font-size: 12px; color: #888;">Thông tin được gửi từ Landing Page ERO Rivesite.</p>
          </div>
        `
      };

      // Nội dung thư cảm ơn gửi cho khách hàng
      const customerMailOptions = {
        from: `"Dự án ECO Riverside" <${process.env.EMAIL_USER}>`,
        to: email, 
        subject: 'Cảm ơn bạn đã đăng ký tư vấn dự án ECO Riverside',
        html: `
          <div style="max-width: 600px; margin: auto; border: 1px solid #eee; font-family: sans-serif;">
            <div style="background-color: #0B1628; color: #C9A84C; padding: 20px; text-align: center;">
              <h1>ECO RIVERSIDE</h1>
            </div>
            <div style="padding: 30px;">
              <p>Xin chào <b>${ho_ten}</b>,</p>
              <p>Chúng tôi đã nhận được thông tin đăng ký tư vấn của bạn. Cảm ơn bạn đã quan tâm đến không gian sống sinh thái tại <b>ECO Riverside</b>.</p>
              <p>Chuyên viên của chúng tôi sẽ liên hệ với bạn qua số điện thoại <b>${so_dien_thoai}</b> trong thời gian sớm nhất.</p>
              <br>
              <p>Trân trọng,</p>
              <p><b>Đội ngũ Marketing dự án ECO Riverside</b></p>
            </div>
          </div>
        `
      };

      // Thực hiện gửi mail (dùng catch để không làm treo luồng chính nếu mail lỗi)
      transporter.sendMail(adminMailOptions).catch(e => console.error("Lỗi mail admin:", e));
      if (email) {
        transporter.sendMail(customerMailOptions).catch(e => console.error("Lỗi mail khách:", e));
      }

      // Ghi log thành công vào database
      db.query(
        `INSERT INTO log (khach_hang_id, hanh_dong, dia_chi_ip) VALUES (?, ?, ?)`,
        [result.insertId, 'đăng ký mới', ip]
      );

      res.json({
        success: true,
        message: 'Đăng ký thành công'
      });
    }
  );
});


// ─────────────────────────────────────────────────────────────────────────
// API 2: XEM DANH SÁCH ĐĂNG KÝ (PRIVATE - CẦN TOKEN)
// ─────────────────────────────────────────────────────────────────────────
router.get('/danh-sach', verifyToken, (req, res) => {
  db.query(
    `SELECT * FROM khach_hang ORDER BY thoi_gian_dang_ky DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
      res.json({ success: true, data: rows });
    }
  );
});


// ─────────────────────────────────────────────────────────────────────────
// API 3: XEM LOG HỆ THỐNG (PRIVATE & ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────
router.get('/log', verifyToken, isAdmin, (req, res) => {
  db.query(
    `SELECT log.*, khach_hang.ho_ten, khach_hang.so_dien_thoai
     FROM log
     LEFT JOIN khach_hang ON log.khach_hang_id = khach_hang.id
     ORDER BY log.thoi_gian DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
      res.json({ success: true, data: rows });
    }
  );
});


// ─────────────────────────────────────────────────────────────────────────
// API 4: XEM CHI TIẾT 1 KHÁCH HÀNG (PRIVATE)
// ─────────────────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  db.query(
    `SELECT * FROM khach_hang WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
      res.json({ success: true, data: rows[0] });
    }
  );
});

module.exports = router;