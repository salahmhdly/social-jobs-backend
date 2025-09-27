const multer = require('multer');
const { storage } = require('../firebase');
const path = require('path');

// إعداد multer للذاكرة المؤقتة
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB حد أقصى لحجم الملف
  },
  fileFilter: (req, file, cb) => {
    // قائمة أنواع الملفات المسموحة
    const allowedTypes = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };

    if (allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'), false);
    }
  }
});

// دالة لرفع ملف واحد إلى Firebase Storage
const uploadFileToFirebase = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      throw new Error('لم يتم تحديد ملف');
    }

    // إنشاء اسم فريد للملف
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${timestamp}_${randomString}${fileExtension}`;

    // الحصول على مرجع الملف في Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    // رفع الملف
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname
        }
      }
    });

    // جعل الملف قابل للقراءة عامة
    await fileRef.makePublic();

    // إرجاع رابط الملف
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    return {
      url: publicUrl,
      fileName: fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };

  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    throw error;
  }
};

// دالة لرفع عدة ملفات
const uploadMultipleFiles = async (files, folder = 'uploads') => {
  try {
    const uploadPromises = files.map(file => uploadFileToFirebase(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('خطأ في رفع الملفات:', error);
    throw error;
  }
};

// دالة لحذف ملف من Firebase Storage
const deleteFileFromFirebase = async (fileName) => {
  try {
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);
    
    await fileRef.delete();
    return true;
  } catch (error) {
    console.error('خطأ في حذف الملف:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadFileToFirebase,
  uploadMultipleFiles,
  deleteFileFromFirebase
};

