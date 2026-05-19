require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const dangkyRoutes = require('./routes/dangky');
const authRoutes = require('./routes/auth');
const userRoutes   = require('./routes/user');

const app = express();

// Tắt header X-Powered-By (thông tin framework không cần lộ ra ngoài)
app.disable('x-powered-by');

// Tắt ETag để tránh rò rỉ thông tin file system qua inode
app.disable('etag');

// CORS: chỉ cho phép các origin trong whitelist (cấu hình qua env ALLOWED_ORIGINS)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push(
    'https://ecoriverside-landingpage.onrender.com',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' không được phép`));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Kiểm tra biến môi trường bắt buộc trước khi khởi động
const REQUIRED_ENV = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error('❌ Thiếu biến môi trường:', missingEnv.join(', '));
  process.exit(1);
}

app.use(express.json({ limit: '100kb' }));

// HTTP Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; connect-src 'self'; frame-ancestors 'none'"
  );
  next();
});

// Gắn các API vào
app.use('/api/dang-ky', dangkyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Kiểm tra server còn sống không
app.get('/', (_req, res) => {
  res.json({ message: 'ERO Rivesite Backend đang chạy' });
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});