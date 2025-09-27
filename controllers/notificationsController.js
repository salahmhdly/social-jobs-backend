const { db } = require('../firebase');

// إنشاء إشعار جديد
const createNotification = async (notificationData) => {
  try {
    const {
      recipientId,
      senderId,
      type,
      contentType,
      contentId,
      commentId,
      replyId,
      content
    } = notificationData;

    // التحقق من البيانات المطلوبة
    if (!recipientId || !senderId || !type || !content) {
      throw new Error('بيانات الإشعار غير مكتملة');
    }

    // التحقق من أنواع الإشعارات المدعومة
    const validTypes = [
      'follow',           // متابع جديد
      'like',            // إعجاب على منشور أو تعليق
      'comment',         // تعليق جديد على منشور
      'reply',           // رد جديد على تعليق
      'new_post',        // منشور جديد من شخص تتابعه
      'admin_warning'    // تحذير من المشرف
    ];

    if (!validTypes.includes(type)) {
      throw new Error('نوع الإشعار غير مدعوم');
    }

    // إنشاء بيانات الإشعار
    const notification = {
      recipientId,
      senderId,
      type,
      content,
      read: false,
      createdAt: new Date()
    };

    // إضافة البيانات الاختيارية
    if (contentType) notification.contentType = contentType;
    if (contentId) notification.contentId = contentId;
    if (commentId) notification.commentId = commentId;
    if (replyId) notification.replyId = replyId;

    // حفظ الإشعار في Firestore
    const notificationRef = await db.collection('notifications').add(notification);

    return {
      id: notificationRef.id,
      ...notification
    };

  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    throw error;
  }
};

// الحصول على إشعارات المستخدم
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const offset = (page - 1) * limit;
    let query = db.collection('notifications').where('recipientId', '==', userId);

    // فلترة الإشعارات غير المقروءة فقط إذا طُلب ذلك
    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    query = query.orderBy('createdAt', 'desc');
    query = query.offset(offset).limit(parseInt(limit));

    const notificationsSnapshot = await query.get();
    const notifications = [];

    // جلب معلومات المرسلين لكل إشعار
    for (const doc of notificationsSnapshot.docs) {
      const notificationData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات المرسل
      if (notificationData.senderId) {
        const senderDoc = await db.collection('users').doc(notificationData.senderId).get();
        if (senderDoc.exists) {
          const senderData = senderDoc.data();
          notificationData.sender = {
            uid: senderData.uid,
            displayName: senderData.displayName,
            photoURL: senderData.photoURL,
            accountType: senderData.accountType
          };
        }
      }

      notifications.push(notificationData);
    }

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notificationsSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// تحديد إشعار كمقروء
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // التحقق من وجود الإشعار
    const notificationDoc = await db.collection('notifications').doc(id).get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    const notificationData = notificationDoc.data();

    // التحقق من أن الإشعار يخص المستخدم الحالي
    if (notificationData.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا الإشعار'
      });
    }

    // تحديث حالة القراءة
    await db.collection('notifications').doc(id).update({
      read: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'تم تحديد الإشعار كمقروء'
    });

  } catch (error) {
    console.error('خطأ في تحديث الإشعار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// تحديد جميع الإشعارات كمقروءة
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.uid;

    // جلب جميع الإشعارات غير المقروءة للمستخدم
    const unreadNotificationsSnapshot = await db.collection('notifications')
      .where('recipientId', '==', userId)
      .where('read', '==', false)
      .get();

    // تحديث جميع الإشعارات غير المقروءة
    const batch = db.batch();
    const readAt = new Date();

    unreadNotificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt
      });
    });

    await batch.commit();

    res.json({
      success: true,
      message: `تم تحديد ${unreadNotificationsSnapshot.docs.length} إشعار كمقروء`,
      updatedCount: unreadNotificationsSnapshot.docs.length
    });

  } catch (error) {
    console.error('خطأ في تحديث الإشعارات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// حذف إشعار
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // التحقق من وجود الإشعار
    const notificationDoc = await db.collection('notifications').doc(id).get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    const notificationData = notificationDoc.data();

    // التحقق من أن الإشعار يخص المستخدم الحالي
    if (notificationData.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا الإشعار'
      });
    }

    // حذف الإشعار
    await db.collection('notifications').doc(id).delete();

    res.json({
      success: true,
      message: 'تم حذف الإشعار بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على عدد الإشعارات غير المقروءة
const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.uid;

    const unreadNotificationsSnapshot = await db.collection('notifications')
      .where('recipientId', '==', userId)
      .where('read', '==', false)
      .get();

    res.json({
      success: true,
      data: {
        unreadCount: unreadNotificationsSnapshot.docs.length
      }
    });

  } catch (error) {
    console.error('خطأ في جلب عدد الإشعارات غير المقروءة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// إنشاء إشعار متابعة جديدة
const createFollowNotification = async (followerId, followedId) => {
  try {
    await createNotification({
      recipientId: followedId,
      senderId: followerId,
      type: 'follow',
      content: 'بدأ في متابعتك'
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار المتابعة:', error);
  }
};

// إنشاء إشعار منشور جديد للمتابعين
const createNewPostNotification = async (postId, authorId) => {
  try {
    // جلب قائمة المتابعين
    const followersSnapshot = await db.collection('users').doc(authorId)
      .collection('followers').get();

    // إنشاء إشعارات للمتابعين
    const batch = db.batch();
    const notificationData = {
      senderId: authorId,
      type: 'new_post',
      contentType: 'posts',
      contentId: postId,
      content: 'نشر منشوراً جديداً',
      read: false,
      createdAt: new Date()
    };

    followersSnapshot.docs.forEach(doc => {
      const followerId = doc.id;
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        ...notificationData,
        recipientId: followerId
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('خطأ في إنشاء إشعارات المنشور الجديد:', error);
  }
};

// إنشاء إشعار تحذير من المشرف
const createAdminWarningNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;

    // التحقق من صلاحيات المشرف (يتم التحقق في middleware)
    
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم والرسالة مطلوبان'
      });
    }

    // التحقق من وجود المستخدم
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // إنشاء إشعار التحذير
    const notification = await createNotification({
      recipientId: userId,
      senderId: req.user.uid, // المشرف
      type: 'admin_warning',
      content: message
    });

    res.status(201).json({
      success: true,
      message: 'تم إرسال التحذير بنجاح',
      data: notification
    });

  } catch (error) {
    console.error('خطأ في إرسال التحذير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  createFollowNotification,
  createNewPostNotification,
  createAdminWarningNotification
};

