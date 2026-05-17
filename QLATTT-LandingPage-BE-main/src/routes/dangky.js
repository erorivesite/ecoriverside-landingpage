const express = require('express');
const router = express.Router();
const db = require('../db');
const sendMail = require('../utils/mailer');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const esc = (str) =>
  str?.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;') ?? '';

router.post('/', async (req, res) => {
  const { ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu } = req.body;

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

  if (!ho_ten || !so_dien_thoai) {
    db.query(`INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`, ['thiếu thông tin', ip],
      (logErr) => { if (logErr) console.error('❌ LOG ERROR:', logErr.message); });
    return res.status(400).json({ success: false, message: 'Thiếu họ tên hoặc số điện thoại' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
  }

  const sql = `
    INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu], async (err, result) => {
    if (err) {
      console.error('❌ DB ERROR:', err.message);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }

    res.json({ success: true, message: 'Đăng ký thành công' });

    db.query(`INSERT INTO log (khach_hang_id, hanh_dong, dia_chi_ip) VALUES (?, ?, ?)`,
      [result.insertId, 'đăng ký mới', ip],
      (logErr) => { if (logErr) console.error('❌ LOG ERROR:', logErr.message); });

    // ─── MAIL ADMIN ───
    sendMail({
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      toName: 'Admin ECO Riverside',
      subject: `🔥 Khách mới: ${ho_ten} — ${so_dien_thoai}`,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#1a1f2e 0%,#2d3548 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;border-bottom:2px solid #c9a96e;">
          <div style="font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;margin-bottom:12px;">ECO Riverside</div>
          <div style="font-size:26px;color:#ffffff;font-weight:normal;letter-spacing:1px;">Khách Hàng Mới</div>
          <div style="width:40px;height:2px;background:#c9a96e;margin:16px auto 0;"></div>
        </td></tr>
        <tr><td style="background:#1e2235;padding:20px 40px;text-align:center;">
          <span style="display:inline-block;background:#c9a96e;color:#0f1117;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:8px 20px;border-radius:20px;font-weight:bold;">🔥 Đăng ký mới vừa vào</span>
        </td></tr>
        <tr><td style="background:#1e2235;padding:10px 40px 30px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:14px 0;border-bottom:1px solid #2a3040;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">👤 Họ tên</div>
              <div style="font-size:15px;color:#e8e8e8;">${esc(ho_ten)}</div>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #2a3040;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">📱 Số điện thoại</div>
              <div style="font-size:15px;color:#e8e8e8;">${esc(so_dien_thoai)}</div>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #2a3040;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">📧 Email</div>
              <div style="font-size:15px;color:#e8e8e8;">${email ? esc(email) : 'Không có'}</div>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #2a3040;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">🏡 Sản phẩm</div>
              <div style="font-size:15px;color:#e8e8e8;">${esc(san_pham || '—')}</div>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #2a3040;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">💰 Ngân sách</div>
              <div style="font-size:15px;color:#e8e8e8;">${esc(ngan_sach || '—')}</div>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #2a3040;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">🕐 Thời gian liên hệ</div>
              <div style="font-size:15px;color:#e8e8e8;">${esc(thoi_gian_lien_he || '—')}</div>
            </td></tr>
            <tr><td style="padding:14px 0;">
              <div style="font-size:10px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:4px;">📝 Ghi chú</div>
              <div style="font-size:15px;color:#e8e8e8;">${esc(ghi_chu || '—')}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#1e2235;padding:0 40px 40px;text-align:center;">
          <a href="tel:${esc(so_dien_thoai)}" style="display:inline-block;background:linear-gradient(135deg,#c9a96e,#e8c98a);color:#0f1117;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 36px;border-radius:4px;font-weight:bold;">Gọi Ngay Cho Khách</a>
        </td></tr>
        <tr><td style="background:#161b2a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #2a3040;">
          <div style="font-size:10px;letter-spacing:2px;color:#4a5568;text-transform:uppercase;">ECO Riverside — Hệ thống CRM</div>
          <div style="font-size:10px;color:#2d3748;margin-top:6px;">IP: ${esc(ip)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    }).then(() => console.log('✅ ADMIN MAIL SENT'))
      .catch(err => console.error('❌ ADMIN MAIL ERROR:', err.message));

    // ─── MAIL KHÁCH ───
    if (email) {
      sendMail({
        to: email,
        toName: ho_ten,
        subject: 'ECO Riverside — Xác nhận đăng ký thành công',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(160deg,#1a1f2e 0%,#2d3548 60%,#3d4a6b 100%);border-radius:16px 16px 0 0;padding:50px 40px;text-align:center;">
          <div style="font-size:10px;letter-spacing:5px;color:#c9a96e;text-transform:uppercase;margin-bottom:16px;">Trân trọng kính gửi</div>
          <div style="font-size:32px;color:#ffffff;font-weight:normal;margin-bottom:8px;">${esc(ho_ten)}</div>
          <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#c9a96e,transparent);margin:20px auto;"></div>
          <div style="font-size:13px;color:#a0aec0;letter-spacing:1px;">Cảm ơn bạn đã tin tưởng ECO Riverside</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:50px 40px;">
          <p style="font-size:16px;color:#2d3748;line-height:1.8;margin:0 0 24px;">Chúng tôi đã nhận được thông tin đăng ký của bạn và rất vui được đồng hành cùng bạn trong hành trình tìm kiếm tổ ấm lý tưởng.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border-left:3px solid #c9a96e;border-radius:0 8px 8px 0;margin:30px 0;">
            <tr><td style="padding:24px;">
              <div style="font-size:10px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;margin-bottom:16px;">Thông tin đăng ký</div>
              ${san_pham ? `<p style="margin:8px 0;font-size:14px;color:#4a5568;">🏡 <b>Sản phẩm:</b> ${esc(san_pham)}</p>` : ''}
              ${ngan_sach ? `<p style="margin:8px 0;font-size:14px;color:#4a5568;">💰 <b>Ngân sách:</b> ${esc(ngan_sach)}</p>` : ''}
              <p style="margin:8px 0;font-size:14px;color:#4a5568;">📱 <b>SĐT liên hệ:</b> ${esc(so_dien_thoai)}</p>
            </td></tr>
          </table>
          <p style="font-size:15px;color:#2d3748;line-height:1.8;margin:0 0 16px;">Chuyên viên tư vấn của chúng tôi sẽ <strong>liên hệ với bạn trong thời gian sớm nhất</strong> để tư vấn chi tiết về dự án.</p>
          <p style="font-size:14px;color:#718096;line-height:1.8;margin:0;">Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ trực tiếp với chúng tôi.</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#e2d9cc,transparent);"></div>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px 40px;text-align:center;">
          <div style="font-size:18px;color:#1a1f2e;letter-spacing:2px;margin-bottom:6px;">ECO RIVERSIDE</div>
          <div style="font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:20px;">Luxury Living by the River</div>
          <div style="font-size:11px;color:#a0aec0;">© 2026 ECO Riverside. All rights reserved.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
      }).then(() => console.log('✅ CUSTOMER MAIL SENT'))
        .catch(err => console.error('❌ CUSTOMER MAIL ERROR:', err.message));
    }
  });
});

router.get('/danh-sach', verifyToken, isAdmin, (req, res) => {
  db.query(`SELECT * FROM khach_hang ORDER BY id DESC`, (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: rows });
  });
});

router.get('/log', verifyToken, isAdmin, (req, res) => {
  db.query(`SELECT * FROM log ORDER BY id DESC`, (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: rows });
  });
});

router.get('/:id', verifyToken, isAdmin, (req, res) => {
  db.query(`SELECT * FROM khach_hang WHERE id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    if (!rows.length) return res.status(404).json({ success: false });
    res.json({ success: true, data: rows[0] });
  });
});

module.exports = router;