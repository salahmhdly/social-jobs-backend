const admin = require("firebase-admin");
require("dotenv").config();
const fs = require("fs");

let serviceAccountConfig;

// الأولوية لمتغيرات البيئة الفردية لضمان التوافق مع Render.com
if (process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccountConfig = {
    type: process.env.FIREBASE_TYPE || "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com",
  };
  console.log("تم تحميل بيانات حساب الخدمة من متغيرات البيئة.");
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  // إذا لم تكن متغيرات البيئة الفردية متاحة، نحاول قراءة من المسار السري
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    serviceAccountConfig = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    console.log("تم تحميل بيانات حساب الخدمة من ملف سري.");
  } catch (error) {
    console.error("خطأ في تحميل ملف حساب الخدمة السري:", error);
    console.error("لم يتم العثور على أي تهيئة لـ Firebase (لا ملف سري ولا متغيرات بيئة فردية).");
    process.exit(1); // إيقاف التطبيق إذا لم يتم العثور على تهيئة
  }
} else {
  console.error("لم يتم العثور على أي تهيئة لـ Firebase (لا ملف سري ولا متغيرات بيئة فردية).");
  process.exit(1); // إيقاف التطبيق إذا لم يتم العثور على تهيئة
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// تصدير خدمات Firebase
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage,
};
