const { auth } = require('../firebase');

// Middleware للتحقق من صحة token المستخدم
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة مطلوب'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // التحقق من صحة token باستخدام Firebase Auth
    const decodedToken = await auth.verifyIdToken(token);
    
    // إضافة معلومات المستخدم إلى request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صحيح'
    });
  }
};

// Middleware للتحقق من صلاحيات المشرف
const authenticateAdmin = async (req, res, next) => {
  try {
    // أولاً التحقق من المصادقة العادية
    await authenticateUser(req, res, () => {});
    
    // التحقق من صلاحيات المشرف
    const { db } = require('../firebase');
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحيات المشرف'
      });
    }
    
    req.user.role = userData.role;
    next();
  } catch (error) {
    console.error('خطأ في التحقق من صلاحيات المشرف:', error);
    return res.status(403).json({
      success: false,
      message: 'خطأ في التحقق من الصلاحيات'
    });
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin
};

