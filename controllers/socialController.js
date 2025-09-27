const { db } = require('../firebase');

// إضافة إعجاب على منشور أو إعلان
const addLike = async (req, res) => {
  try {
    const { contentType, contentId } = req.params; // contentType: 'posts' أو 'ads'
    const userId = req.user.uid;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    // التحقق من وجود المحتوى
    const contentDoc = await db.collection(contentType).doc(contentId).get();
    if (!contentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }

    // التحقق من عدم وجود إعجاب مسبق
    const likeDoc = await db.collection(contentType).doc(contentId)
      .collection('likes').doc(userId).get();
    
    if (likeDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'لقد أعجبت بهذا المحتوى بالفعل'
      });
    }

    // إضافة الإعجاب
    const batch = db.batch();
    
    // إضافة الإعجاب إلى المجموعة الفرعية
    batch.set(
      db.collection(contentType).doc(contentId).collection('likes').doc(userId),
      {
        userId,
        createdAt: new Date()
      }
    );
    
    // تحديث عداد الإعجابات
    batch.update(
      db.collection(contentType).doc(contentId),
      {
        likesCount: db.FieldValue.increment(1)
      }
    );

    await batch.commit();

    // إنشاء إشعار لصاحب المحتوى (إذا لم يكن هو نفسه)
    const contentData = contentDoc.data();
    if (contentData.userId !== userId) {
      await createNotification({
        recipientId: contentData.userId,
        senderId: userId,
        type: 'like',
        contentType,
        contentId,
        content: `أعجب بـ${contentType === 'posts' ? 'منشورك' : 'إعلانك'}`
      });
    }

    res.json({
      success: true,
      message: 'تم إضافة الإعجاب بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إضافة الإعجاب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// إزالة إعجاب من منشور أو إعلان
const removeLike = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.uid;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    // التحقق من وجود الإعجاب
    const likeDoc = await db.collection(contentType).doc(contentId)
      .collection('likes').doc(userId).get();
    
    if (!likeDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'لم تعجب بهذا المحتوى'
      });
    }

    // إزالة الإعجاب
    const batch = db.batch();
    
    // حذف الإعجاب من المجموعة الفرعية
    batch.delete(
      db.collection(contentType).doc(contentId).collection('likes').doc(userId)
    );
    
    // تحديث عداد الإعجابات
    batch.update(
      db.collection(contentType).doc(contentId),
      {
        likesCount: db.FieldValue.increment(-1)
      }
    );

    await batch.commit();

    res.json({
      success: true,
      message: 'تم إزالة الإعجاب بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إزالة الإعجاب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة المعجبين
const getLikes = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    const offset = (page - 1) * limit;

    const likesSnapshot = await db.collection(contentType).doc(contentId)
      .collection('likes')
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const likes = [];
    for (const doc of likesSnapshot.docs) {
      const likeData = doc.data();
      
      // جلب معلومات المستخدم
      const userDoc = await db.collection('users').doc(likeData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        likes.push({
          userId: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType,
          likedAt: likeData.createdAt
        });
      }
    }

    res.json({
      success: true,
      data: likes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: likesSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المعجبين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// إضافة تعليق على منشور أو إعلان
const addComment = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { text } = req.body;
    const userId = req.user.uid;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    // التحقق من وجود النص
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'نص التعليق مطلوب'
      });
    }

    // التحقق من وجود المحتوى
    const contentDoc = await db.collection(contentType).doc(contentId).get();
    if (!contentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }

    // إنشاء التعليق
    const commentData = {
      userId,
      text: text.trim(),
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const batch = db.batch();
    
    // إضافة التعليق إلى المجموعة الفرعية
    const commentRef = db.collection(contentType).doc(contentId).collection('comments').doc();
    batch.set(commentRef, commentData);
    
    // تحديث عداد التعليقات
    batch.update(
      db.collection(contentType).doc(contentId),
      {
        commentsCount: db.FieldValue.increment(1)
      }
    );

    await batch.commit();

    // جلب معلومات المستخدم للاستجابة
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const responseData = {
      id: commentRef.id,
      ...commentData,
      author: {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        accountType: userData.accountType
      }
    };

    // إنشاء إشعار لصاحب المحتوى (إذا لم يكن هو نفسه)
    const contentData = contentDoc.data();
    if (contentData.userId !== userId) {
      await createNotification({
        recipientId: contentData.userId,
        senderId: userId,
        type: 'comment',
        contentType,
        contentId,
        commentId: commentRef.id,
        content: `علق على ${contentType === 'posts' ? 'منشورك' : 'إعلانك'}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إضافة التعليق بنجاح',
      data: responseData
    });

  } catch (error) {
    console.error('خطأ في إضافة التعليق:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة التعليقات
const getComments = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    const offset = (page - 1) * limit;

    const commentsSnapshot = await db.collection(contentType).doc(contentId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const comments = [];
    for (const doc of commentsSnapshot.docs) {
      const commentData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات المستخدم
      const userDoc = await db.collection('users').doc(commentData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        commentData.author = {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType
        };
      }

      comments.push(commentData);
    }

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: commentsSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب التعليقات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// حذف تعليق
const deleteComment = async (req, res) => {
  try {
    const { contentType, contentId, commentId } = req.params;
    const userId = req.user.uid;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    // التحقق من وجود التعليق
    const commentDoc = await db.collection(contentType).doc(contentId)
      .collection('comments').doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'التعليق غير موجود'
      });
    }

    const commentData = commentDoc.data();

    // التحقق من أن المستخدم هو صاحب التعليق
    if (commentData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا التعليق'
      });
    }

    const batch = db.batch();
    
    // حذف التعليق
    batch.delete(
      db.collection(contentType).doc(contentId).collection('comments').doc(commentId)
    );
    
    // تحديث عداد التعليقات
    batch.update(
      db.collection(contentType).doc(contentId),
      {
        commentsCount: db.FieldValue.increment(-1)
      }
    );

    await batch.commit();

    res.json({
      success: true,
      message: 'تم حذف التعليق بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف التعليق:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// إضافة رد على تعليق
const addReply = async (req, res) => {
  try {
    const { contentType, contentId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.uid;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    // التحقق من وجود النص
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'نص الرد مطلوب'
      });
    }

    // التحقق من وجود التعليق
    const commentDoc = await db.collection(contentType).doc(contentId)
      .collection('comments').doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'التعليق غير موجود'
      });
    }

    // إنشاء الرد
    const replyData = {
      userId,
      text: text.trim(),
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const batch = db.batch();
    
    // إضافة الرد إلى المجموعة الفرعية للتعليق
    const replyRef = db.collection(contentType).doc(contentId)
      .collection('comments').doc(commentId)
      .collection('replies').doc();
    batch.set(replyRef, replyData);
    
    // تحديث عداد الردود في التعليق
    batch.update(
      db.collection(contentType).doc(contentId).collection('comments').doc(commentId),
      {
        repliesCount: db.FieldValue.increment(1)
      }
    );

    await batch.commit();

    // جلب معلومات المستخدم للاستجابة
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const responseData = {
      id: replyRef.id,
      ...replyData,
      author: {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        accountType: userData.accountType
      }
    };

    // إنشاء إشعار لصاحب التعليق (إذا لم يكن هو نفسه)
    const commentData = commentDoc.data();
    if (commentData.userId !== userId) {
      await createNotification({
        recipientId: commentData.userId,
        senderId: userId,
        type: 'reply',
        contentType,
        contentId,
        commentId,
        replyId: replyRef.id,
        content: 'رد على تعليقك'
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: responseData
    });

  } catch (error) {
    console.error('خطأ في إضافة الرد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة الردود
const getReplies = async (req, res) => {
  try {
    const { contentType, contentId, commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // التحقق من نوع المحتوى
    if (!['posts', 'ads'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صحيح'
      });
    }

    const offset = (page - 1) * limit;

    const repliesSnapshot = await db.collection(contentType).doc(contentId)
      .collection('comments').doc(commentId)
      .collection('replies')
      .orderBy('createdAt', 'asc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const replies = [];
    for (const doc of repliesSnapshot.docs) {
      const replyData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات المستخدم
      const userDoc = await db.collection('users').doc(replyData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        replyData.author = {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType
        };
      }

      replies.push(replyData);
    }

    res.json({
      success: true,
      data: replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: repliesSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الردود:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// دالة مساعدة لإنشاء الإشعارات
const createNotification = async (notificationData) => {
  try {
    await db.collection('notifications').add({
      ...notificationData,
      read: false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
  }
};

module.exports = {
  addLike,
  removeLike,
  getLikes,
  addComment,
  getComments,
  deleteComment,
  addReply,
  getReplies
};

