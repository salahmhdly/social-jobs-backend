const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  createAd,
  getAd,
  getAds,
  updateAd,
  deleteAd,
  searchAds
} = require('../controllers/adsController');

// إنشاء إعلان جديد
router.post('/', authenticateUser, upload.array('images', 5), createAd);

// الحصول على إعلان محدد
router.get('/:id', authenticateUser, getAd);

// الحصول على قائمة الإعلانات مع الفلترة
router.get('/', authenticateUser, getAds);

// تحديث إعلان
router.put('/:id', authenticateUser, upload.array('images', 5), updateAd);

// حذف إعلان
router.delete('/:id', authenticateUser, deleteAd);

// البحث في الإعلانات
router.get('/search/query', authenticateUser, searchAds);

module.exports = router;

