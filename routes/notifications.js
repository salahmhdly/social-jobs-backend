const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  createAdminWarningNotification
} = require('../controllers/notificationsController');

// الحصول على إشعارات المستخدم
router.get('/', authenticateUser, getUserNotifications);

// الحصول على عدد الإشعارات غير المقروءة
router.get('/unread-count', authenticateUser, getUnreadNotificationsCount);

// تحديد إشعار كمقروء
router.put('/:id/read', authenticateUser, markNotificationAsRead);

// تحديد جميع الإشعارات كمقروءة
router.put('/mark-all-read', authenticateUser, markAllNotificationsAsRead);

// حذف إشعار
router.delete('/:id', authenticateUser, deleteNotification);

// إرسال تحذير من المشرف (للمشرفين فقط)
router.post('/admin-warning', authenticateAdmin, createAdminWarningNotification);

module.exports = router;

