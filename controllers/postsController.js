const { db } = require('../firebase');
const { uploadFileToFirebase, uploadMultipleFiles } = require('../middleware/uploadMiddleware');

// إنشاء منشور جديد
const createPost = async (req, res) => {
  try {
    const { text, tags } = req.body;
    const userId = req.user.uid;

    // التحقق من وجود محتوى
    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'النص أو الصور مطلوبة'
      });
    }

    // رفع الملفات إذا كانت موجودة
    let imageUrls = [];
    let videoUrl = '';

    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await uploadMultipleFiles(req.files, 'posts');
        
        // فصل الصور عن الفيديوهات
        uploadResults.forEach(result => {
          if (result.mimetype.startsWith('image/')) {
            imageUrls.push(result.url);
          } else if (result.mimetype.startsWith('video/')) {
            videoUrl = result.url; // فيديو واحد فقط
          }
        });
      } catch (uploadError) {
        console.error('خطأ في رفع الملفات:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'خطأ في رفع الملفات'
        });
      }
    }

    // إنشاء بيانات المنشور
    const postData = {
      userId,
      text: text || '',
      imageUrls,
      videoUrl,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // حفظ المنشور في Firestore
    const postRef = await db.collection('posts').add(postData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنشور بنجاح',
      data: {
        id: postRef.id,
        ...postData
      }
    });

  } catch (error) {
    console.error('خطأ في إنشاء المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على منشور محدد
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const postData = { id: postDoc.id, ...postDoc.data() };

    // جلب معلومات صاحب المنشور
    const userDoc = await db.collection('users').doc(postData.userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      postData.author = {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        accountType: userData.accountType
      };
    }

    res.json({
      success: true,
      data: postData
    });

  } catch (error) {
    console.error('خطأ في جلب المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة المنشورات (Feed)
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const requestingUserId = req.user.uid;

    const offset = (page - 1) * limit;
    let query = db.collection('posts').where('isActive', '==', true);

    // إذا تم تحديد userId، جلب منشورات مستخدم معين
    if (userId) {
      query = query.where('userId', '==', userId);
    } else {
      // جلب منشورات الأشخاص المتابَعين + منشورات المستخدم نفسه
      const followingSnapshot = await db.collection('users').doc(requestingUserId)
        .collection('following').get();
      
      const followingIds = followingSnapshot.docs.map(doc => doc.id);
      followingIds.push(requestingUserId); // إضافة المستخدم نفسه

      if (followingIds.length > 0) {
        // Firestore يدعم حتى 10 عناصر في array-contains-any
        if (followingIds.length <= 10) {
          query = query.where('userId', 'in', followingIds);
        } else {
          // إذا كان العدد أكبر من 10، نحتاج لتقسيم الاستعلام
          // للبساطة، سنأخذ أول 10 فقط
          query = query.where('userId', 'in', followingIds.slice(0, 10));
        }
      }
    }

    query = query.orderBy('createdAt', 'desc');
    query = query.offset(offset).limit(parseInt(limit));

    const postsSnapshot = await query.get();
    const posts = [];

    // جلب معلومات المؤلفين لكل منشور
    for (const doc of postsSnapshot.docs) {
      const postData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات صاحب المنشور
      const userDoc = await db.collection('users').doc(postData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        postData.author = {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType
        };
      }

      posts.push(postData);
    }

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: postsSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المنشورات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// تحديث منشور
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { text, tags } = req.body;

    // التحقق من وجود المنشور
    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const postData = postDoc.data();

    // التحقق من أن المستخدم هو صاحب المنشور
    if (postData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا المنشور'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    // إضافة الحقول المحدثة فقط
    if (text !== undefined) updateData.text = text;
    if (tags !== undefined) {
      updateData.tags = tags.split(',').map(tag => tag.trim());
    }

    // رفع ملفات جديدة إذا كانت موجودة
    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await uploadMultipleFiles(req.files, 'posts');
        
        const newImageUrls = [];
        let newVideoUrl = '';
        
        uploadResults.forEach(result => {
          if (result.mimetype.startsWith('image/')) {
            newImageUrls.push(result.url);
          } else if (result.mimetype.startsWith('video/')) {
            newVideoUrl = result.url;
          }
        });

        if (newImageUrls.length > 0) {
          updateData.imageUrls = [...(postData.imageUrls || []), ...newImageUrls];
        }
        
        if (newVideoUrl) {
          updateData.videoUrl = newVideoUrl;
        }
      } catch (uploadError) {
        console.error('خطأ في رفع الملفات:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'خطأ في رفع الملفات'
        });
      }
    }

    await db.collection('posts').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'تم تحديث المنشور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// حذف منشور
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // التحقق من وجود المنشور
    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const postData = postDoc.data();

    // التحقق من أن المستخدم هو صاحب المنشور
    if (postData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا المنشور'
      });
    }

    // حذف المنشور
    await db.collection('posts').doc(id).delete();

    res.json({
      success: true,
      message: 'تم حذف المنشور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// البحث في المنشورات
const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'كلمة البحث مطلوبة'
      });
    }

    const offset = (page - 1) * limit;
    let query = db.collection('posts').where('isActive', '==', true);

    query = query.orderBy('createdAt', 'desc');
    query = query.offset(offset).limit(parseInt(limit));

    const postsSnapshot = await query.get();
    let posts = [];

    // جلب المنشورات مع معلومات المؤلفين
    for (const doc of postsSnapshot.docs) {
      const postData = { id: doc.id, ...doc.data() };
      
      // جلب معلومات صاحب المنشور
      const userDoc = await db.collection('users').doc(postData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        postData.author = {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType
        };
      }

      posts.push(postData);
    }

    // تطبيق البحث النصي
    const searchTerm = q.toLowerCase();
    posts = posts.filter(post => 
      post.text.toLowerCase().includes(searchTerm) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
      (post.author && post.author.displayName.toLowerCase().includes(searchTerm))
    );

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: postsSnapshot.docs.length === parseInt(limit)
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
  createPost,
  getPost,
  getPosts,
  updatePost,
  deletePost,
  searchPosts
};

