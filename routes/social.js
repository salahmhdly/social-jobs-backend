const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const {
  addLike,
  removeLike,
  getLikes,
  addComment,
  getComments,
  deleteComment,
  addReply,
  getReplies
} = require('../controllers/socialController');

// ===== الإعجابات =====

// إضافة إعجاب على منشور أو إعلان
router.post('/:contentType/:contentId/like', authenticateUser, addLike);

// إزالة إعجاب من منشور أو إعلان
router.delete('/:contentType/:contentId/like', authenticateUser, removeLike);

// الحصول على قائمة المعجبين
router.get('/:contentType/:contentId/likes', authenticateUser, getLikes);

// ===== التعليقات =====

// إضافة تعليق على منشور أو إعلان
router.post('/:contentType/:contentId/comments', authenticateUser, addComment);

// الحصول على قائمة التعليقات
router.get('/:contentType/:contentId/comments', authenticateUser, getComments);

// حذف تعليق
router.delete('/:contentType/:contentId/comments/:commentId', authenticateUser, deleteComment);

// ===== الردود =====

// إضافة رد على تعليق
router.post('/:contentType/:contentId/comments/:commentId/replies', authenticateUser, addReply);

// الحصول على قائمة الردود
router.get('/:contentType/:contentId/comments/:commentId/replies', authenticateUser, getReplies);

module.exports = router;

