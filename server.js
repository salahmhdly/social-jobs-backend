const express = require('express');
const cors = require('cors');
require('dotenv').config();

// استيراد الـ routes
const usersRoutes = require('./routes/users');
const adsRoutes = require('./routes/ads');
const postsRoutes = require('./routes/posts');
const socialRoutes = require('./routes/social');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// إنشاء تطبيق Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====

// تمكين CORS لجميع الطلبات
app.use(cors({
  origin: '*', // السماح لجميع المصادر
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// تحليل JSON
app.use(express.json({ limit: '10mb' }));

// تحليل URL-encoded data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware لتسجيل الطلبات
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== Routes =====

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً بك في خادم تطبيق الوظائف والإعلانات المبوبة',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      ads: '/api/ads',
      posts: '/api/posts',
      social: '/api/social',
      notifications: '/api/notifications',
      admin: '/api/admin'
    }
  });
});

// صفحة الحالة
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// تسجيل الـ routes
app.use('/api/users', usersRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// ===== Error Handling =====

// معالج للمسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
});

// معالج الأخطاء العام
app.use((error, req, res, next) => {
  console.error('خطأ في الخادم:', error);
  
  // خطأ في رفع الملفات
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'حجم الملف كبير جداً'
    });
  }
  
  // خطأ في تحليل JSON
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'بيانات JSON غير صحيحة'
    });
  }
  
  // خطأ عام
  res.status(500).json({
    success: false,
    message: 'خطأ داخلي في الخادم'
  });
});

// ===== تشغيل الخادم =====

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🌐 الرابط المحلي: http://localhost:${PORT}`);
  console.log(`📚 وثائق API متاحة على: http://localhost:${PORT}/`);
  console.log(`💚 فحص الحالة: http://localhost:${PORT}/health`);
});

// معالجة إغلاق الخادم بشكل صحيح
process.on('SIGTERM', () => {
  console.log('🛑 تم استلام إشارة SIGTERM، إغلاق الخادم...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 تم استلام إشارة SIGINT، إغلاق الخادم...');
  process.exit(0);
});

module.exports = app;

