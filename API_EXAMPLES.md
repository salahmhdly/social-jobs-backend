# أمثلة استخدام API

هذا الملف يحتوي على أمثلة عملية لاستخدام جميع endpoints في الخادم.

## 🔐 المصادقة

جميع الطلبات (عدا تسجيل الحساب) تحتاج إلى رمز مصادقة:

```bash
# Header مطلوب في جميع الطلبات
Authorization: Bearer <firebase_id_token>
```

## 👥 المستخدمين

### تسجيل حساب جديد
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "displayName": "أحمد محمد",
    "accountType": "individual",
    "phoneNumber": "+966501234567",
    "location": "الرياض، السعودية",
    "bio": "مطور برمجيات"
  }'
```

### الحصول على معلومات المستخدم
```bash
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تحديث الملف الشخصي
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "أحمد محمد السعيد",
    "bio": "مطور برمجيات خبير",
    "location": "جدة، السعودية"
  }'
```

### متابعة مستخدم
```bash
curl -X POST http://localhost:3000/api/users/TARGET_USER_ID/follow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إلغاء متابعة مستخدم
```bash
curl -X DELETE http://localhost:3000/api/users/TARGET_USER_ID/follow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### قائمة المتابِعين
```bash
curl -X GET "http://localhost:3000/api/users/USER_ID/followers?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📢 الإعلانات

### إنشاء إعلان جديد
```bash
curl -X POST http://localhost:3000/api/ads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "type=job" \
  -F "title=مطور React Native" \
  -F "description=نبحث عن مطور React Native خبير للانضمام لفريقنا" \
  -F "location=الرياض" \
  -F "category=تقنية" \
  -F "salary=8000-12000 ريال" \
  -F "requirements=خبرة 3 سنوات في React Native" \
  -F "contactInfo=hr@company.com" \
  -F "tags=react,native,mobile,تطوير" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### الحصول على قائمة الإعلانات
```bash
curl -X GET "http://localhost:3000/api/ads?page=1&limit=20&type=job&category=تقنية&location=الرياض" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### الحصول على إعلان محدد
```bash
curl -X GET http://localhost:3000/api/ads/AD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تحديث إعلان
```bash
curl -X PUT http://localhost:3000/api/ads/AD_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=مطور React Native - محدث" \
  -F "salary=9000-13000 ريال"
```

### حذف إعلان
```bash
curl -X DELETE http://localhost:3000/api/ads/AD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### البحث في الإعلانات
```bash
curl -X GET "http://localhost:3000/api/ads/search/query?q=مطور&type=job&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 المنشورات

### إنشاء منشور جديد
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=مرحباً بالجميع! هذا أول منشور لي" \
  -F "tags=مرحبا,أول_منشور" \
  -F "media=@/path/to/image.jpg" \
  -F "media=@/path/to/video.mp4"
```

### الحصول على قائمة المنشورات (Feed)
```bash
curl -X GET "http://localhost:3000/api/posts?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### الحصول على منشورات مستخدم معين
```bash
curl -X GET "http://localhost:3000/api/posts?userId=USER_ID&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### الحصول على منشور محدد
```bash
curl -X GET http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تحديث منشور
```bash
curl -X PUT http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=النص المحدث للمنشور" \
  -F "tags=محدث,جديد"
```

### حذف منشور
```bash
curl -X DELETE http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### البحث في المنشورات
```bash
curl -X GET "http://localhost:3000/api/posts/search/query?q=تقنية&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💬 الميزات الاجتماعية

### إضافة إعجاب
```bash
# على منشور
curl -X POST http://localhost:3000/api/social/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"

# على إعلان
curl -X POST http://localhost:3000/api/social/ads/AD_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إزالة إعجاب
```bash
curl -X DELETE http://localhost:3000/api/social/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### قائمة المعجبين
```bash
curl -X GET "http://localhost:3000/api/social/posts/POST_ID/likes?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إضافة تعليق
```bash
curl -X POST http://localhost:3000/api/social/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "تعليق رائع على هذا المنشور!"
  }'
```

### قائمة التعليقات
```bash
curl -X GET "http://localhost:3000/api/social/posts/POST_ID/comments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### حذف تعليق
```bash
curl -X DELETE http://localhost:3000/api/social/posts/POST_ID/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إضافة رد على تعليق
```bash
curl -X POST http://localhost:3000/api/social/posts/POST_ID/comments/COMMENT_ID/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "رد على التعليق"
  }'
```

### قائمة الردود
```bash
curl -X GET "http://localhost:3000/api/social/posts/POST_ID/comments/COMMENT_ID/replies?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔔 الإشعارات

### الحصول على إشعارات المستخدم
```bash
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### الحصول على الإشعارات غير المقروءة فقط
```bash
curl -X GET "http://localhost:3000/api/notifications?unreadOnly=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### عدد الإشعارات غير المقروءة
```bash
curl -X GET http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تحديد إشعار كمقروء
```bash
curl -X PUT http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تحديد جميع الإشعارات كمقروءة
```bash
curl -X PUT http://localhost:3000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### حذف إشعار
```bash
curl -X DELETE http://localhost:3000/api/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 👨‍💼 الإدارة (للمشرفين فقط)

### إحصائيات لوحة التحكم
```bash
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### قائمة المستخدمين
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20&accountType=company&isApproved=false" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### قبول حساب مستخدم
```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### رفض حساب مستخدم
```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "بيانات غير مكتملة"
  }'
```

### حظر مستخدم
```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/block \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "انتهاك شروط الاستخدام"
  }'
```

### إلغاء حظر مستخدم
```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/unblock \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### الإعلانات في انتظار الموافقة
```bash
curl -X GET "http://localhost:3000/api/admin/ads/pending?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### قبول إعلان
```bash
curl -X PUT http://localhost:3000/api/admin/ads/AD_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### رفض إعلان
```bash
curl -X PUT http://localhost:3000/api/admin/ads/AD_ID/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "محتوى غير مناسب"
  }'
```

### حذف إعلان (للمشرفين)
```bash
curl -X DELETE http://localhost:3000/api/admin/ads/AD_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "انتهاك سياسة المحتوى"
  }'
```

### إنشاء بلاغ
```bash
curl -X POST http://localhost:3000/api/admin/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "posts",
    "contentId": "POST_ID",
    "problemType": "spam",
    "description": "هذا المنشور يحتوي على محتوى مزعج"
  }'
```

### قائمة البلاغات
```bash
curl -X GET "http://localhost:3000/api/admin/reports?page=1&limit=20&status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### تحديث حالة بلاغ
```bash
curl -X PUT http://localhost:3000/api/admin/reports/REPORT_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "adminNotes": "تم حل المشكلة وإزالة المحتوى المخالف"
  }'
```

### إرسال تحذير من المشرف
```bash
curl -X POST http://localhost:3000/api/notifications/admin-warning \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "message": "تحذير: يرجى الالتزام بشروط الاستخدام"
  }'
```

## 📊 أمثلة الاستجابات

### استجابة ناجحة
```json
{
  "success": true,
  "message": "تم بنجاح",
  "data": {
    // البيانات المطلوبة
  }
}
```

### استجابة مع تقسيم الصفحات
```json
{
  "success": true,
  "data": [
    // قائمة البيانات
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### استجابة خطأ
```json
{
  "success": false,
  "message": "وصف الخطأ"
}
```

## 🔧 نصائح للاستخدام

1. **رموز المصادقة:** احصل على Firebase ID Token من تطبيق العميل
2. **رفع الملفات:** استخدم `multipart/form-data` لرفع الملفات
3. **التقسيم:** استخدم `page` و `limit` للتحكم في حجم النتائج
4. **الفلترة:** استخدم query parameters للفلترة والبحث
5. **معالجة الأخطاء:** تحقق دائماً من `success` في الاستجابة

