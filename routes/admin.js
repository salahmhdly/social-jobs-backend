const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/authMiddleware');
const {
  // إدارة المستخدمين
  getUsers,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
  
  // إدارة الإعلانات
  getPendingAds,
  approveAd,
  rejectAd,
  deleteAdByAdmin,
  
  // إدارة البلاغات
  createReport,
  getReports,
  updateReportStatus,
  
  // الإحصائيات
  getDashboardStats
} = require('../controllers/adminController');

// ===== إحصائيات لوحة التحكم =====
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

// ===== إدارة المستخدمين =====

// الحصول على قائمة المستخدمين
router.get('/users', authenticateAdmin, getUsers);

// الموافقة على حساب مستخدم
router.put('/users/:userId/approve', authenticateAdmin, approveUser);

// رفض حساب مستخدم
router.put('/users/:userId/reject', authenticateAdmin, rejectUser);

// حظر مستخدم
router.put('/users/:userId/block', authenticateAdmin, blockUser);

// إلغاء حظر مستخدم
router.put('/users/:userId/unblock', authenticateAdmin, unblockUser);

// ===== إدارة الإعلانات =====

// الحصول على الإعلانات في انتظار الموافقة
router.get('/ads/pending', authenticateAdmin, getPendingAds);

// الموافقة على إعلان
router.put('/ads/:adId/approve', authenticateAdmin, approveAd);

// رفض إعلان
router.put('/ads/:adId/reject', authenticateAdmin, rejectAd);

// حذف إعلان (للمشرفين)
router.delete('/ads/:adId', authenticateAdmin, deleteAdByAdmin);

// ===== إدارة البلاغات =====

// إنشاء بلاغ (للمستخدمين العاديين)
router.post('/reports', authenticateUser, createReport);

// الحصول على قائمة البلاغات (للمشرفين)
router.get('/reports', authenticateAdmin, getReports);

// تحديث حالة بلاغ (للمشرفين)
router.put('/reports/:reportId/status', authenticateAdmin, updateReportStatus);

module.exports = router;

