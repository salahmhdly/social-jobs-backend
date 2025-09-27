const { db } = require('../firebase');

// ===== إدارة المستخدمين =====

// الحصول على قائمة المستخدمين مع الفلترة
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      accountType, 
      isBlocked, 
      isApproved,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db.collection('users');

    // تطبيق الفلاتر
    if (accountType) {
      query = query.where('accountType', '==', accountType);
    }

    if (isBlocked !== undefined) {
      query = query.where('isBlocked', '==', isBlocked === 'true');
    }

    if (isApproved !== undefined) {
      query = query.where('isApproved', '==', isApproved === 'true');
    }

    query = query.orderBy('createdAt', 'desc');
    query = query.offset(offset).limit(parseInt(limit));

    const usersSnapshot = await query.get();
    let users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // تطبيق البحث النصي إذا كان موجوداً
    if (search) {
      const searchTerm = search.toLowerCase();
      users = users.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: usersSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الموافقة على حساب مستخدم
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // التحقق من وجود المستخدم
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تحديث حالة الموافقة
    await db.collection('users').doc(userId).update({
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'تم قبول الحساب بنجاح'
    });

  } catch (error) {
    console.error('خطأ في قبول الحساب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// رفض حساب مستخدم
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // التحقق من وجود المستخدم
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تحديث حالة الرفض
    await db.collection('users').doc(userId).update({
      isApproved: false,
      rejectedAt: new Date(),
      rejectedBy: req.user.uid,
      rejectionReason: reason || 'لم يتم تحديد السبب'
    });

    res.json({
      success: true,
      message: 'تم رفض الحساب بنجاح'
    });

  } catch (error) {
    console.error('خطأ في رفض الحساب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// حظر مستخدم
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // التحقق من وجود المستخدم
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const userData = userDoc.data();

    // منع حظر المشرفين
    if (userData.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حظر المشرفين'
      });
    }

    // تحديث حالة الحظر
    await db.collection('users').doc(userId).update({
      isBlocked: true,
      blockedAt: new Date(),
      blockedBy: req.user.uid,
      blockReason: reason || 'لم يتم تحديد السبب'
    });

    res.json({
      success: true,
      message: 'تم حظر المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حظر المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// إلغاء حظر مستخدم
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // التحقق من وجود المستخدم
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // إلغاء الحظر
    await db.collection('users').doc(userId).update({
      isBlocked: false,
      unblockedAt: new Date(),
      unblockedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'تم إلغاء حظر المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إلغاء حظر المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// ===== إدارة الإعلانات =====

// الحصول على الإعلانات في انتظار الموافقة
const getPendingAds = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const adsSnapshot = await db.collection('ads')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const ads = [];
    for (const doc of adsSnapshot.docs) {
      const adData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات صاحب الإعلان
      const userDoc = await db.collection('users').doc(adData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        adData.author = {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType
        };
      }

      ads.push(adData);
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
    console.error('خطأ في جلب الإعلانات المعلقة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الموافقة على إعلان
const approveAd = async (req, res) => {
  try {
    const { adId } = req.params;

    // التحقق من وجود الإعلان
    const adDoc = await db.collection('ads').doc(adId).get();
    if (!adDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }

    // تحديث حالة الإعلان
    await db.collection('ads').doc(adId).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'تم قبول الإعلان بنجاح'
    });

  } catch (error) {
    console.error('خطأ في قبول الإعلان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// رفض إعلان
const rejectAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const { reason } = req.body;

    // التحقق من وجود الإعلان
    const adDoc = await db.collection('ads').doc(adId).get();
    if (!adDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }

    // تحديث حالة الإعلان
    await db.collection('ads').doc(adId).update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: req.user.uid,
      rejectionReason: reason || 'لم يتم تحديد السبب'
    });

    res.json({
      success: true,
      message: 'تم رفض الإعلان بنجاح'
    });

  } catch (error) {
    console.error('خطأ في رفض الإعلان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// حذف إعلان (للمشرفين)
const deleteAdByAdmin = async (req, res) => {
  try {
    const { adId } = req.params;
    const { reason } = req.body;

    // التحقق من وجود الإعلان
    const adDoc = await db.collection('ads').doc(adId).get();
    if (!adDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }

    const adData = adDoc.data();

    // حفظ سجل الحذف
    await db.collection('admin_actions').add({
      action: 'delete_ad',
      adminId: req.user.uid,
      targetId: adId,
      targetUserId: adData.userId,
      reason: reason || 'لم يتم تحديد السبب',
      createdAt: new Date()
    });

    // حذف الإعلان
    await db.collection('ads').doc(adId).delete();

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

// ===== إدارة البلاغات =====

// إنشاء بلاغ
const createReport = async (req, res) => {
  try {
    const { contentType, contentId, problemType, description } = req.body;
    const reporterId = req.user.uid;

    // التحقق من البيانات المطلوبة
    if (!contentType || !contentId || !problemType) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى ومعرف المحتوى ونوع المشكلة مطلوبة'
      });
    }

    // التحقق من نوع المحتوى
    if (!['posts', 'ads', 'users'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    // التحقق من وجود المحتوى المبلغ عنه
    const contentDoc = await db.collection(contentType).doc(contentId).get();
    if (!contentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى المبلغ عنه غير موجود'
      });
    }

    // إنشاء البلاغ
    const reportData = {
      reporterId,
      contentType,
      contentId,
      problemType,
      description: description || '',
      status: 'pending',
      createdAt: new Date()
    };

    const reportRef = await db.collection('reports').add(reportData);

    res.status(201).json({
      success: true,
      message: 'تم إرسال البلاغ بنجاح',
      data: {
        id: reportRef.id,
        ...reportData
      }
    });

  } catch (error) {
    console.error('خطأ في إنشاء البلاغ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة البلاغات
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contentType } = req.query;
    const offset = (page - 1) * limit;

    let query = db.collection('reports');

    // تطبيق الفلاتر
    if (status) {
      query = query.where('status', '==', status);
    }

    if (contentType) {
      query = query.where('contentType', '==', contentType);
    }

    query = query.orderBy('createdAt', 'desc');
    query = query.offset(offset).limit(parseInt(limit));

    const reportsSnapshot = await query.get();
    const reports = [];

    for (const doc of reportsSnapshot.docs) {
      const reportData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات المبلغ
      const reporterDoc = await db.collection('users').doc(reportData.reporterId).get();
      if (reporterDoc.exists) {
        const reporterData = reporterDoc.data();
        reportData.reporter = {
          uid: reporterData.uid,
          displayName: reporterData.displayName,
          photoURL: reporterData.photoURL
        };
      }

      reports.push(reportData);
    }

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: reportsSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب البلاغات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// تحديث حالة بلاغ
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    // التحقق من الحالة
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة البلاغ غير صحيحة'
      });
    }

    // التحقق من وجود البلاغ
    const reportDoc = await db.collection('reports').doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'البلاغ غير موجود'
      });
    }

    // تحديث البلاغ
    const updateData = {
      status,
      updatedAt: new Date(),
      reviewedBy: req.user.uid
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db.collection('reports').doc(reportId).update(updateData);

    res.json({
      success: true,
      message: 'تم تحديث حالة البلاغ بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث البلاغ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// ===== إحصائيات لوحة التحكم =====

const getDashboardStats = async (req, res) => {
  try {
    // إحصائيات المستخدمين
    const totalUsersSnapshot = await db.collection('users').get();
    const pendingUsersSnapshot = await db.collection('users')
      .where('isApproved', '==', false).get();
    const blockedUsersSnapshot = await db.collection('users')
      .where('isBlocked', '==', true).get();

    // إحصائيات الإعلانات
    const totalAdsSnapshot = await db.collection('ads').get();
    const pendingAdsSnapshot = await db.collection('ads')
      .where('status', '==', 'pending').get();
    const approvedAdsSnapshot = await db.collection('ads')
      .where('status', '==', 'approved').get();

    // إحصائيات المنشورات
    const totalPostsSnapshot = await db.collection('posts').get();

    // إحصائيات البلاغات
    const totalReportsSnapshot = await db.collection('reports').get();
    const pendingReportsSnapshot = await db.collection('reports')
      .where('status', '==', 'pending').get();

    const stats = {
      users: {
        total: totalUsersSnapshot.docs.length,
        pending: pendingUsersSnapshot.docs.length,
        blocked: blockedUsersSnapshot.docs.length,
        active: totalUsersSnapshot.docs.length - blockedUsersSnapshot.docs.length
      },
      ads: {
        total: totalAdsSnapshot.docs.length,
        pending: pendingAdsSnapshot.docs.length,
        approved: approvedAdsSnapshot.docs.length
      },
      posts: {
        total: totalPostsSnapshot.docs.length
      },
      reports: {
        total: totalReportsSnapshot.docs.length,
        pending: pendingReportsSnapshot.docs.length
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

module.exports = {
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
};

