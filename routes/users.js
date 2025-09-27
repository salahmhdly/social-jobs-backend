const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const {
  createUser,
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require('../controllers/userController');

// إنشاء حساب جديد (لا يحتاج مصادقة)
router.post('/register', createUser);

// الحصول على معلومات المستخدم
router.get('/:uid', authenticateUser, getUserProfile);

// تحديث معلومات المستخدم
router.put('/:uid', authenticateUser, updateUserProfile);

// متابعة مستخدم
router.post('/:uid/follow', authenticateUser, followUser);

// إلغاء متابعة مستخدم
router.delete('/:uid/follow', authenticateUser, unfollowUser);

// الحصول على قائمة المتابِعين
router.get('/:uid/followers', authenticateUser, getFollowers);

// الحصول على قائمة المتابَعين
router.get('/:uid/following', authenticateUser, getFollowing);

module.exports = router;

