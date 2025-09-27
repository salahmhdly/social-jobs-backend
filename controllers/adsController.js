const { db } = require('../firebase');
const { uploadFileToFirebase, uploadMultipleFiles } = require('../middleware/uploadMiddleware');

// إنشاء إعلان جديد
const createAd = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      location,
      category,
      salary,
      requirements,
      contactInfo,
      tags
    } = req.body;

    const userId = req.user.uid;

    // التحقق من البيانات المطلوبة
    if (!type || !title || !description || !location || !category) {
      return res.status(400).json({
        success: false,
        message: 'النوع والعنوان والوصف والموقع والفئة مطلوبة'
      });
    }

    // التحقق من نوع الإعلان
    const validTypes = ['job', 'classified', 'real_estate', 'service'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الإعلان غير صحيح'
      });
    }

    // رفع الصور إذا كانت موجودة
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await uploadMultipleFiles(req.files, 'ads');
        imageUrls = uploadResults.map(result => result.url);
      } catch (uploadError) {
        console.error('خطأ في رفع الصور:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'خطأ في رفع الصور'
        });
      }
    }

    // إنشاء بيانات الإعلان
    const adData = {
      userId,
      type,
      title,
      description,
      location,
      category,
      salary: salary || '',
      requirements: requirements || '',
      contactInfo: contactInfo || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      imageUrls,
      status: 'pending', // في انتظار الموافقة
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // حفظ الإعلان في Firestore
    const adRef = await db.collection('ads').add(adData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإعلان بنجاح وهو في انتظار الموافقة',
      data: {
        id: adRef.id,
        ...adData
      }
    });

  } catch (error) {
    console.error('خطأ في إنشاء الإعلان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على إعلان محدد
const getAd = async (req, res) => {
  try {
    const { id } = req.params;

    const adDoc = await db.collection('ads').doc(id).get();

    if (!adDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }

    const adData = { id: adDoc.id, ...adDoc.data() };

    // زيادة عدد المشاهدات
    await db.collection('ads').doc(id).update({
      viewsCount: (adData.viewsCount || 0) + 1
    });

    adData.viewsCount = (adData.viewsCount || 0) + 1;

    res.json({
      success: true,
      data: adData
    });

  } catch (error) {
    console.error('خطأ في جلب الإعلان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة الإعلانات مع الفلترة والتقسيم
const getAds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      location,
      status = 'approved',
      userId,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db.collection('ads');

    // تطبيق الفلاتر
    if (type) {
      query = query.where('type', '==', type);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (location) {
      query = query.where('location', '==', location);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    // ترتيب النتائج
    query = query.orderBy('createdAt', 'desc');

    // تطبيق التقسيم
    query = query.offset(offset).limit(parseInt(limit));

    const adsSnapshot = await query.get();
    let ads = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // تطبيق البحث النصي إذا كان موجوداً
    if (search) {
      const searchTerm = search.toLowerCase();
      ads = ads.filter(ad => 
        ad.title.toLowerCase().includes(searchTerm) ||
        ad.description.toLowerCase().includes(searchTerm) ||
        (ad.tags && ad.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    res.json({
      success: true,
      data: ads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: adsSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الإعلانات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// تحديث إعلان
const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // التحقق من وجود الإعلان
    const adDoc = await db.collection('ads').doc(id).get();

    if (!adDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }

    const adData = adDoc.data();

    // التحقق من أن المستخدم هو صاحب الإعلان
    if (adData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا الإعلان'
      });
    }

    const {
      title,
      description,
      location,
      category,
      salary,
      requirements,
      contactInfo,
      tags
    } = req.body;

    const updateData = {
      updatedAt: new Date(),
      status: 'pending' // إعادة الإعلان لحالة الانتظار بعد التحديث
    };

    // إضافة الحقول المحدثة فقط
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (category !== undefined) updateData.category = category;
    if (salary !== undefined) updateData.salary = salary;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (tags !== undefined) {
      updateData.tags = tags.split(',').map(tag => tag.trim());
    }

    // رفع صور جديدة إذا كانت موجودة
    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await uploadMultipleFiles(req.files, 'ads');
        const newImageUrls = uploadResults.map(result => result.url);
        updateData.imageUrls = [...(adData.imageUrls || []), ...newImageUrls];
      } catch (uploadError) {
        console.error('خطأ في رفع الصور:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'خطأ في رفع الصور'
        });
      }
    }

    await db.collection('ads').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'تم تحديث الإعلان بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث الإعلان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// حذف إعلان
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // التحقق من وجود الإعلان
    const adDoc = await db.collection('ads').doc(id).get();

    if (!adDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }

    const adData = adDoc.data();

    // التحقق من أن المستخدم هو صاحب الإعلان
    if (adData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا الإعلان'
      });
    }

    // حذف الإعلان
    await db.collection('ads').doc(id).delete();

    res.json({
      success: true,
      message: 'تم حذف الإعلان بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف الإعلان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// البحث في الإعلانات
const searchAds = async (req, res) => {
  try {
    const { q, type, category, location, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'كلمة البحث مطلوبة'
      });
    }

    const offset = (page - 1) * limit;
    let query = db.collection('ads').where('status', '==', 'approved');

    // تطبيق الفلاتر الإضافية
    if (type) {
      query = query.where('type', '==', type);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (location) {
      query = query.where('location', '==', location);
    }

    query = query.orderBy('createdAt', 'desc');
    query = query.offset(offset).limit(parseInt(limit));

    const adsSnapshot = await query.get();
    let ads = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // تطبيق البحث النصي
    const searchTerm = q.toLowerCase();
    ads = ads.filter(ad => 
      ad.title.toLowerCase().includes(searchTerm) ||
      ad.description.toLowerCase().includes(searchTerm) ||
      (ad.tags && ad.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );

    res.json({
      success: true,
      data: ads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: adsSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

module.exports = {
  createAd,
  getAd,
  getAds,
  updateAd,
  deleteAd,
  searchAds
};

