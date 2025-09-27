# خادم تطبيق الوظائف والإعلانات المبوبة

خادم خلفي (Backend) كامل وشامل لتطبيق اجتماعي للوظائف والإعلانات المبوبة مبني باستخدام Node.js, Express.js, و Firebase.

## 🚀 الميزات الرئيسية

### 🔐 المصادقة وإدارة المستخدمين
- تسجيل حسابات جديدة بأنواع مختلفة (فرد، شركة، مكتب توظيف، مكتب عقاري)
- تسجيل دخول آمن باستخدام Firebase Authentication
- إدارة الملفات الشخصية (CRUD كامل)
- نظام المتابعة (Follow/Unfollow) بين المستخدمين

### 📝 إدارة المحتوى
- إنشاء وإدارة الإعلانات (وظائف، مبوبة، عقارات، خدمات)
- إنشاء وإدارة المنشورات الاجتماعية
- رفع الملفات (صور، فيديوهات، مستندات) إلى Firebase Storage
- نظام البحث والفلترة المتقدم
- تقسيم الصفحات (Pagination) لجميع القوائم

### 💬 الميزات الاجتماعية
- الإعجابات على المنشورات والإعلانات
- التعليقات والردود على التعليقات
- نظام التفاعل الاجتماعي الكامل

### 🔔 نظام الإشعارات
- إشعارات المتابعة الجديدة
- إشعارات الإعجابات والتعليقات
- إشعارات المنشورات الجديدة من المتابَعين
- إشعارات التحذيرات من المشرفين

### 👨‍💼 لوحة التحكم والإشراف
- إدارة المستخدمين (قبول، رفض، حظر)
- إدارة الإعلانات (موافقة، رفض، حذف)
- نظام البلاغات وإدارتها
- إحصائيات شاملة للوحة التحكم

## 🛠️ التقنيات المستخدمة

- **الخادم:** Node.js مع Express.js
- **المصادقة:** Firebase Authentication
- **قاعدة البيانات:** Firebase Firestore
- **تخزين الملفات:** Firebase Storage
- **رفع الملفات:** Multer
- **CORS:** مدعوم لجميع المصادر

## 📁 هيكل المشروع

```
social-jobs-backend/
├── controllers/           # منطق الأعمال
│   ├── userController.js
│   ├── adsController.js
│   ├── postsController.js
│   ├── socialController.js
│   ├── notificationsController.js
│   └── adminController.js
├── middleware/           # الوظائف الوسيطة
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
├── routes/              # مسارات API
│   ├── users.js
│   ├── ads.js
│   ├── posts.js
│   ├── social.js
│   ├── notifications.js
│   └── admin.js
├── firebase.js          # تهيئة Firebase
├── server.js           # الملف الرئيسي
├── .env               # متغيرات البيئة
└── package.json       # تبعيات المشروع
```

## ⚙️ التثبيت والتشغيل

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. تهيئة متغيرات البيئة
قم بتحديث ملف `.env` ببيانات Firebase الخاصة بك:

```env
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your_private_key...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
```

### 3. تشغيل الخادم

#### للتطوير:
```bash
npm run dev
```

#### للإنتاج:
```bash
npm start
```

الخادم سيعمل على `http://localhost:3000`

## 📚 واجهات برمجة التطبيقات (API)

### المستخدمين (`/api/users`)
- `POST /register` - تسجيل حساب جديد
- `GET /:uid` - الحصول على معلومات المستخدم
- `PUT /:uid` - تحديث معلومات المستخدم
- `POST /:uid/follow` - متابعة مستخدم
- `DELETE /:uid/follow` - إلغاء متابعة مستخدم
- `GET /:uid/followers` - قائمة المتابِعين
- `GET /:uid/following` - قائمة المتابَعين

### الإعلانات (`/api/ads`)
- `POST /` - إنشاء إعلان جديد
- `GET /` - الحصول على قائمة الإعلانات
- `GET /:id` - الحصول على إعلان محدد
- `PUT /:id` - تحديث إعلان
- `DELETE /:id` - حذف إعلان
- `GET /search/query` - البحث في الإعلانات

### المنشورات (`/api/posts`)
- `POST /` - إنشاء منشور جديد
- `GET /` - الحصول على قائمة المنشورات (Feed)
- `GET /:id` - الحصول على منشور محدد
- `PUT /:id` - تحديث منشور
- `DELETE /:id` - حذف منشور
- `GET /search/query` - البحث في المنشورات

### الميزات الاجتماعية (`/api/social`)
- `POST /:contentType/:contentId/like` - إضافة إعجاب
- `DELETE /:contentType/:contentId/like` - إزالة إعجاب
- `GET /:contentType/:contentId/likes` - قائمة المعجبين
- `POST /:contentType/:contentId/comments` - إضافة تعليق
- `GET /:contentType/:contentId/comments` - قائمة التعليقات
- `DELETE /:contentType/:contentId/comments/:commentId` - حذف تعليق
- `POST /:contentType/:contentId/comments/:commentId/replies` - إضافة رد
- `GET /:contentType/:contentId/comments/:commentId/replies` - قائمة الردود

### الإشعارات (`/api/notifications`)
- `GET /` - الحصول على إشعارات المستخدم
- `GET /unread-count` - عدد الإشعارات غير المقروءة
- `PUT /:id/read` - تحديد إشعار كمقروء
- `PUT /mark-all-read` - تحديد جميع الإشعارات كمقروءة
- `DELETE /:id` - حذف إشعار

### الإدارة (`/api/admin`)
- `GET /dashboard/stats` - إحصائيات لوحة التحكم
- `GET /users` - قائمة المستخدمين
- `PUT /users/:userId/approve` - قبول حساب مستخدم
- `PUT /users/:userId/reject` - رفض حساب مستخدم
- `PUT /users/:userId/block` - حظر مستخدم
- `PUT /users/:userId/unblock` - إلغاء حظر مستخدم
- `GET /ads/pending` - الإعلانات في انتظار الموافقة
- `PUT /ads/:adId/approve` - قبول إعلان
- `PUT /ads/:adId/reject` - رفض إعلان
- `DELETE /ads/:adId` - حذف إعلان
- `POST /reports` - إنشاء بلاغ
- `GET /reports` - قائمة البلاغات
- `PUT /reports/:reportId/status` - تحديث حالة بلاغ

## 🔒 المصادقة

جميع endpoints (عدا تسجيل الحساب) تتطلب رمز مصادقة في header:

```
Authorization: Bearer <firebase_id_token>
```

endpoints الإدارة تتطلب صلاحيات مشرف إضافية.

## 🗃️ تصميم قاعدة البيانات

### المجموعات الرئيسية في Firestore:

#### `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  accountType: 'individual' | 'company' | 'recruitment_office' | 'real_estate_office',
  phoneNumber: string,
  location: string,
  bio: string,
  photoURL: string,
  coverURL: string,
  followersCount: number,
  followingCount: number,
  isBlocked: boolean,
  isApproved: boolean,
  role: 'user' | 'admin',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `ads`
```javascript
{
  userId: string,
  type: 'job' | 'classified' | 'real_estate' | 'service',
  title: string,
  description: string,
  location: string,
  category: string,
  salary: string,
  requirements: string,
  contactInfo: string,
  tags: array,
  imageUrls: array,
  status: 'pending' | 'approved' | 'rejected',
  likesCount: number,
  commentsCount: number,
  viewsCount: number,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `posts`
```javascript
{
  userId: string,
  text: string,
  imageUrls: array,
  videoUrl: string,
  tags: array,
  likesCount: number,
  commentsCount: number,
  sharesCount: number,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `notifications`
```javascript
{
  recipientId: string,
  senderId: string,
  type: 'follow' | 'like' | 'comment' | 'reply' | 'new_post' | 'admin_warning',
  content: string,
  contentType: string,
  contentId: string,
  commentId: string,
  replyId: string,
  read: boolean,
  createdAt: timestamp
}
```

#### `reports`
```javascript
{
  reporterId: string,
  contentType: 'posts' | 'ads' | 'users',
  contentId: string,
  problemType: string,
  description: string,
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
  adminNotes: string,
  createdAt: timestamp
}
```

### المجموعات الفرعية:
- `users/{uid}/following` - قائمة المتابَعين
- `users/{uid}/followers` - قائمة المتابِعين
- `ads/{adId}/comments` - تعليقات الإعلان
- `posts/{postId}/comments` - تعليقات المنشور
- `comments/{commentId}/replies` - ردود التعليق
- `ads/{adId}/likes` - إعجابات الإعلان
- `posts/{postId}/likes` - إعجابات المنشور

## 🔧 الإعدادات المطلوبة في Firebase

### 1. Firebase Authentication
- تمكين تسجيل الدخول بالبريد الإلكتروني وكلمة المرور

### 2. Firestore Database
- إنشاء قاعدة بيانات في وضع الاختبار أو الإنتاج
- تطبيق قواعد الأمان المناسبة

### 3. Firebase Storage
- تمكين Firebase Storage
- تطبيق قواعد الأمان للملفات

## 🚀 النشر

### استخدام خدمة النشر المدمجة:
```bash
# تشغيل الخادم محلياً أولاً للاختبار
npm start

# ثم استخدام أداة النشر المناسبة
```

## 🔍 الاختبار

### اختبار الصفحة الرئيسية:
```bash
curl http://localhost:3000/
```

### اختبار حالة الخادم:
```bash
curl http://localhost:3000/health
```

## 📝 ملاحظات مهمة

1. **الأمان:** تأكد من تطبيق قواعد الأمان المناسبة في Firestore و Storage
2. **المتغيرات:** لا تشارك ملف `.env` أو بيانات Firebase الحساسة
3. **الحدود:** Firebase لديه حدود للاستخدام المجاني، راجع خطة التسعير
4. **النسخ الاحتياطي:** قم بعمل نسخ احتياطية منتظمة لقاعدة البيانات

## 🤝 المساهمة

هذا المشروع تم تطويره بواسطة Manus AI. للمساهمة أو الإبلاغ عن مشاكل، يرجى التواصل معنا.

## 📄 الترخيص

MIT License - راجع ملف LICENSE للتفاصيل.

