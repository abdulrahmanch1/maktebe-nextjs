# دار القرَاء (نسخة Next.js)

دار القرَاء هي مكتبة عربية تم إعادة بنائها باستخدام Next.js للواجهة الأمامية، مع الحفاظ على الواجهة الخلفية الأصلية المبنية بـ Node.js + Express + MongoDB.

## ️ المتطلبات
- Node.js
- MongoDB
- npm

---

## التشغيل

لتشغيل المشروع بالكامل، يجب تشغيل كل من الواجهة الخلفية والواجهة الأمامية.

### ✅ الواجهة الخلفية (Backend)

الواجهة الخلفية موجودة في مجلد `maktebe` الأصلي. لتشغيلها:

```bash
# انتقل إلى مجلد المشروع الأصلي
cd /home/abdulrahman/maktebe/backend

# تثبيت الاعتماديات
npm install

# تشغيل الخادم
npm run dev
```

تأكد من وجود ملف `.env` في مجلد `maktebe/backend` يحتوي على المتغيرات التالية:
```
JWT_SECRET=your_jwt_secret_key
MONGO_URI=mongodb://localhost:27017/maktebe
```

---

### ✅ الواجهة الأمامية (Frontend - Next.js)

الواجهة الأمامية موجودة في هذا المجلد (`maktebe-nextjs`). لتشغيلها:

```bash
# (يفترض أنك في مجلد maktebe-nextjs)

# تثبيت الاعتماديات (إذا لم تقم بذلك من قبل)
npm install

# تشغيل خادم التطوير
npm run dev
```

تأكد من وجود ملف `.env.local` في جذر المشروع (`maktebe-nextjs`) يحتوي على المتغير التالي:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

بعد تشغيل كلا الجزأين، يمكنك فتح [http://localhost:3000](http://localhost:3000) في متصفحك لرؤية التطبيق.

---

## ✨ الميزات

* واجهة عربية
* تسجيل دخول JWT
* عرض وإضافة كتب للمفضلة
* CRUD للكتب
* صفحات ديناميكية مع توليد البيانات من الخادم (Server-Side Rendering) بفضل Next.js

---

## نشر على Vercel

عند نشر المشروع على Vercel، ستحتاج فقط إلى نشر مشروع `maktebe-nextjs`. يجب عليك تعيين متغيرات البيئة التالية في إعدادات المشروع على Vercel:

- `NEXT_PUBLIC_API_URL`: رابط الواجهة الخلفية (Backend) بعد نشرها.