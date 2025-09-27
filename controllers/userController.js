const { db, auth } = require('../firebase');

// إنشاء حساب مستخدم جديد
const createUser = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      displayName, 
      accountType, 
      phoneNumber,
      location,
      bio 
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!email || !password || !displayName || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور واسم العرض ونوع الحساب مطلوبة'
      });
    }

    // التحقق من نوع الحساب
    const validAccountTypes = ['individual', 'company', 'recruitment_office', 'real_estate_office'];
    if (!validAccountTypes.includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الحساب غير صحيح'
      });
    }

    // إنشاء المستخدم في Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || null
    });

    // إنشاء مستند المستخدم في Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      accountType,
      phoneNumber: phoneNumber || '',
      location: location || '',
      bio: bio || '',
      photoURL: '',
      coverURL: '',
      followersCount: 0,
      followingCount: 0,
      isBlocked: false,
      isApproved: accountType === 'individual' ? true : false, // الأفراد يتم قبولهم تلقائياً
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        accountType: userData.accountType
      }
    });

  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    
    // التعامل مع أخطاء Firebase المختلفة
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور ضعيفة جداً'
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على معلومات المستخدم
const getUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const requestingUserId = req.user.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const userData = userDoc.data();
    
    // إخفاء بعض البيانات الحساسة إذا لم يكن المستخدم نفسه
    if (uid !== requestingUserId) {
      delete userData.email;
      delete userData.phoneNumber;
    }

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// تحديث معلومات المستخدم
const updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const requestingUserId = req.user.uid;

    // التأكد من أن المستخدم يحدث ملفه الشخصي فقط
    if (uid !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا الملف الشخصي'
      });
    }

    const { 
      displayName, 
      phoneNumber, 
      location, 
      bio, 
      photoURL, 
      coverURL 
    } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    // إضافة الحقول المحدثة فقط
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (coverURL !== undefined) updateData.coverURL = coverURL;

    await db.collection('users').doc(uid).update(updateData);

    // تحديث displayName في Firebase Auth أيضاً
    if (displayName) {
      await auth.updateUser(uid, { displayName });
    }

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// متابعة مستخدم
const followUser = async (req, res) => {
  try {
    const { uid } = req.params; // المستخدم المراد متابعته
    const followerId = req.user.uid; // المستخدم الذي يتابع

    if (uid === followerId) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك متابعة نفسك'
      });
    }

    // التحقق من وجود المستخدم المراد متابعته
    const targetUserDoc = await db.collection('users').doc(uid).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من عدم وجود متابعة مسبقة
    const followDoc = await db.collection('users').doc(followerId)
      .collection('following').doc(uid).get();
    
    if (followDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'أنت تتابع هذا المستخدم بالفعل'
      });
    }

    // إضافة المتابعة
    const batch = db.batch();
    
    // إضافة إلى قائمة المتابَعين للمستخدم الحالي
    batch.set(
      db.collection('users').doc(followerId).collection('following').doc(uid),
      { createdAt: new Date() }
    );
    
    // إضافة إلى قائمة المتابِعين للمستخدم المراد متابعته
    batch.set(
      db.collection('users').doc(uid).collection('followers').doc(followerId),
      { createdAt: new Date() }
    );
    
    // تحديث عدادات المتابعة
    batch.update(
      db.collection('users').doc(followerId),
      { followingCount: db.FieldValue.increment(1) }
    );
    
    batch.update(
      db.collection('users').doc(uid),
      { followersCount: db.FieldValue.increment(1) }
    );

    await batch.commit();

    res.json({
      success: true,
      message: 'تم متابعة المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في متابعة المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// إلغاء متابعة مستخدم
const unfollowUser = async (req, res) => {
  try {
    const { uid } = req.params; // المستخدم المراد إلغاء متابعته
    const followerId = req.user.uid; // المستخدم الذي يلغي المتابعة

    // التحقق من وجود المتابعة
    const followDoc = await db.collection('users').doc(followerId)
      .collection('following').doc(uid).get();
    
    if (!followDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'أنت لا تتابع هذا المستخدم'
      });
    }

    // إلغاء المتابعة
    const batch = db.batch();
    
    // حذف من قائمة المتابَعين للمستخدم الحالي
    batch.delete(
      db.collection('users').doc(followerId).collection('following').doc(uid)
    );
    
    // حذف من قائمة المتابِعين للمستخدم المراد إلغاء متابعته
    batch.delete(
      db.collection('users').doc(uid).collection('followers').doc(followerId)
    );
    
    // تحديث عدادات المتابعة
    batch.update(
      db.collection('users').doc(followerId),
      { followingCount: db.FieldValue.increment(-1) }
    );
    
    batch.update(
      db.collection('users').doc(uid),
      { followersCount: db.FieldValue.increment(-1) }
    );

    await batch.commit();

    res.json({
      success: true,
      message: 'تم إلغاء متابعة المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إلغاء متابعة المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة المتابِعين
const getFollowers = async (req, res) => {
  try {
    const { uid } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const followersSnapshot = await db.collection('users').doc(uid)
      .collection('followers')
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const followers = [];
    for (const doc of followersSnapshot.docs) {
      const followerDoc = await db.collection('users').doc(doc.id).get();
      if (followerDoc.exists) {
        const followerData = followerDoc.data();
        followers.push({
          uid: followerData.uid,
          displayName: followerData.displayName,
          photoURL: followerData.photoURL,
          accountType: followerData.accountType
        });
      }
    }

    res.json({
      success: true,
      data: followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: followersSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المتابِعين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

// الحصول على قائمة المتابَعين
const getFollowing = async (req, res) => {
  try {
    const { uid } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const followingSnapshot = await db.collection('users').doc(uid)
      .collection('following')
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const following = [];
    for (const doc of followingSnapshot.docs) {
      const followingDoc = await db.collection('users').doc(doc.id).get();
      if (followingDoc.exists) {
        const followingData = followingDoc.data();
        following.push({
          uid: followingData.uid,
          displayName: followingData.displayName,
          photoURL: followingData.photoURL,
          accountType: followingData.accountType
        });
      }
    }

    res.json({
      success: true,
      data: following,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: followingSnapshot.docs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المتابَعين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

module.exports = {
  createUser,
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
};

