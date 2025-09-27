const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  createPost,
  getPost,
  getPosts,
  updatePost,
  deletePost,
  searchPosts
} = require('../controllers/postsController');

// إنشاء منشور جديد
router.post('/', authenticateUser, upload.array('media', 5), createPost);

// الحصول على منشور محدد
router.get('/:id', authenticateUser, getPost);

// الحصول على قائمة المنشورات (Feed)
router.get('/', authenticateUser, getPosts);

// تحديث منشور
router.put('/:id', authenticateUser, upload.array('media', 5), updatePost);

// حذف منشور
router.delete('/:id', authenticateUser, deletePost);

// البحث في المنشورات
router.get('/search/query', authenticateUser, searchPosts);

module.exports = router;

