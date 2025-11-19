# دار القراء

دار القرَاء هي مكتبة عربية تم إعادة بنائها باستخدام Next.js للواجهة الأمامية، وتستخدم Supabase للمصادقة وقاعدة البيانات (للكتب والتعليقات ورسائل الاتصال وميزات المستخدم). الواجهة الخلفية الأصلية المبنية بـ Node.js + Express + MongoDB قد تخدم أدوارًا تكميلية أو تاريخية.

## ️ المتطلبات
- Node.js
- npm
- Supabase Project (for Authentication and Database)

---

## التشغيل

لتشغيل المشروع بالكامل، يجب تشغيل كل من الواجهة الخلفية والواجهة الأمامية.

### ✅ الواجهة الخلفية (Backend) (الواجهة الخلفية الأصلية)

الواجهة الخلفية الأصلية موجودة في مجلد `maktebe` الأصلي. هذه الواجهة الخلفية قد تخدم أغراضًا تاريخية أو ميزات محددة لم يتم ترحيلها بالكامل إلى Supabase. **ملاحظة: مشروع `maktebe-nextjs` الحالي يعتمد بشكل أساسي على Supabase لجميع وظائفه الرئيسية (المصادقة، الكتب، التعليقات، رسائل الاتصال). تشغيل الواجهة الخلفية الأصلية ليس ضروريًا للوظائف الأساسية لهذا المشروع.**

```bash
# انتقل إلى مجلد المشروع الأصلي
cd /home/abdulrahman/maktebe/backend

# تثبيت الاعتماديات
npm install

# تشغيل الخادم
npm run dev
```

تأكد من وجود ملف `.env` في مجلد `maktebe/backend` يحتوي على المتغيرات التالية (إذا كانت الواجهة الخلفية لا تزال قيد الاستخدام):
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

تأكد من وجود ملف `.env.local` في جذر المشروع (`maktebe-nextjs`) يحتوي على المتغيرات التالية:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000/api # إذا كنت تستخدم مسارات Next.js API كـ BFF
```

بعد تشغيل كلا الجزأين (إذا كانت الواجهة الخلفية الأصلية لا تزال قيد الاستخدام)، يمكنك فتح [http://localhost:3000](http://localhost:3000) في متصفحك لرؤية التطبيق.

---

## ✨ الميزات

* واجهة عربية
* مصادقة المستخدم عبر Supabase (تسجيل، تسجيل دخول، تحقق من البريد الإلكتروني)
* عرض وإضافة كتب للمفضلة (مدعومة بـ Supabase)
* CRUD للكتب (مدعومة بـ Supabase)
* صفحات ديناميكية مع توليد البيانات من الخادم (Server-Side Rendering) بفضل Next.js
* إدارة قائمة القراءة
* نظام التعليقات (مدعوم بـ Supabase)
* نموذج الاتصال

---

## نشر على Vercel

عند نشر المشروع على Vercel، ستحتاج فقط إلى نشر مشروع `maktebe-nextjs`. يجب عليك تعيين متغيرات البيئة التالية في إعدادات المشروع على Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`: رابط مشروع Supabase الخاص بك.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: مفتاح Supabase Anon Key الخاص بك.
- `NEXT_PUBLIC_API_URL`: رابط الواجهة الأمامية (Frontend) بعد نشرها (عادةً رابط Vercel الخاص بالمشروع نفسه إذا كنت تستخدم مسارات Next.js API كـ BFF).

---

## نسخة PWA (إضافة الموقع للتطبيقات)

المشروع أصبح يحتوي على:

- ملف Manifest ديناميكي (`app/manifest.js`) مع أيقونات واسم تطبيق واضح.
- Service Worker في `public/sw.js` يدعم العمل دون اتصال ويخزّن صفحة `/offline`.
- صفحة Offline جاهزة (`/offline`) ورسالة ترحيب عند عدم توفر الإنترنت.
- تسجيل تلقائي لـ Service Worker من خلال المكوّن `PWAServiceWorker`. يتم التسجيل تلقائياً في بيئة الإنتاج فقط.

### ماذا تحتاج لبيئة الإنتاج؟
1. تأكد من أن النطاق يعمل عبر HTTPS حتى يتم قبول الـ PWA في المتصفحات و Android.
2. حدّث الأيقونات في مجلد `public/icons` إذا رغبت بأيقونات مخصّصة (الألوان الحالية مجرد نمط افتراضي).
3. جرّب تثبيت التطبيق من متصفح Chrome/Edge (زر “Install App”) للتحقق من تجربة PWA.

### تخصيص إضافي
يمكنك تعديل قائمة الموارد المسبقة التحميل داخل `public/sw.js` إذا أردت إضافة صفحات أو صور معينة إلى التخزين المؤقت.

---

## بناء نسخة للجوال (Android / iOS)

### 1. المتطلبات
- Node.js
- Android Studio أو Xcode
- Java 17 (مطلوب مع Android Gradle Plugin 8.7+)
- حساب Google Play Console و/أو Apple Developer (اختياري للنشر)

### 2. تفعيل وضع الخادم عن بُعد لتطبيقات Capacitor
- ملف الإعداد أصبح `capacitor.config.ts` ويقرأ تلقائياً متغيري `CAP_SERVER_URL` أو `NEXT_PUBLIC_APP_URL`. احرص على وضع رابط النسخة المنشورة (مثال: `https://app.dar-alquraa.com`) داخل `.env` قبل تشغيل أي أمر لـ Capacitor.
- إذا احتجت لتعبئة التطبيق بملفات ثابتة بدلاً من الخادم البعيد فستحتاج إلى `next export` (غير موصى به حالياً لأن التطبيق يستخدم ميزات SSR واشتراك Supabase).

### 3. تثبيت أدوات Capacitor (مرة واحدة)
```
npm install --save @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
```

### 4. أوامر العمل اليومية
- بناء نسخة الويب الإنتاجية: `npm run build`
- نسخ ملفات الويب وتحديث الإضافات: `npm run android:sync`
- فتح مشروع أندرويد: `npm run android:open`
- إنشاء حزمة اختبار أو إصدار:
  - `npm run android:apk` لتجربة Debug على جهاز حقيقي.
  - `npm run android:bundle` لإنتاج ملف `.aab` المطلوب من Google Play.

### 5. تحضير المنصات
```
npx cap add android
npx cap add ios
```
> تم إنشاء مشروع Android وجاهز داخل مجلد `android/`. أضف iOS عند الحاجة من macOS.

### 6. نصائح عامة
- حدّث الأيقونات وملفات الـ Splash داخل `android/app/src/main/res` بعد فتح Android Studio (`mipmap-*` و `drawable-*`).
- استخدم متغيرات البيئات (`CAP_SERVER_URL`, `NEXT_PUBLIC_SUPABASE_URL`, …) في ملف `.env` ذاته حتى تعمل نسخة الويب والتطبيق بنفس الإعدادات.
- اختبر التطبيق على أجهزة حقيقية مع اتصال وإنترنت ضعيف للتأكد من أن صفحة `/offline` وملف `sw.js` يعملان كما يجب.

### 7. نشر على Google Play (خطوات دقيقة)
1. **تجهيز البيئة**: فعل `CAP_SERVER_URL` للإشارة إلى نطاق HTTPS النهائي، ثم نفّذ `npm run build`.
2. **مزامنة Capacitor**: شغّل `npm run android:sync` حتى تُكتب الإعدادات داخل `android/app/src/main/assets/capacitor.config.json`.
3. **فتح Android Studio**: `npm run android:open` ثم انتظر حتى يكتمل مزامنة Gradle. عدّل ما يلي قبل البناء:
   - ملف `android/app/build.gradle`: حدّث `versionName` و `versionCode` في كل إصدار.
   - `AndroidManifest.xml`: تأكد من الأيقونة، الصلاحيات، ورابط التطبيق (تم ضبط `allowBackup=false` و `usesCleartextTraffic=false` مسبقاً).
   - مجلدات `mipmap-*` و `drawable-*`: استبدل الأيقونات وصور الـ Splash بملفاتك.
4. **توقيع التطبيق**: أنشئ Keystore عبر **Build > Generate Signed Bundle/APK…** واحفظ بياناته في مكان آمن لاستخدامه مستقبلاً.
5. **بناء ملف AAB**: اختر Android App Bundle وحدد build type = Release. يمكن إنجاز ذلك أيضاً عبر سطر الأوامر `npm run android:bundle` (لا يعمل دون إنشاء ملف `release.keystore` مسبقاً).
6. **اختبارات نهائية**: استخدم `adb install` مع ملف الـAPK أو الحزمة الداخلية للتأكد من أن تسجيل الدخول، تحميل الكتب، والعمل بلا اتصال كلها تعمل.
7. **Google Play Console**: 
   - ارفع ملف AAB إلى مسار Internal Testing أولاً.
   - أضف صور المتجر (1920x1080 وما فوق)، الوصف العربي، وسياسة خصوصية.
   - استخدم نفس رقم الإصدار (`versionCode`) الموجود في `build.gradle`.
   - بعد اعتماد المراجعة انقل الإصدار لقناة الإنتاج.

> **ملاحظة:** جميع أوامر Capacitor متوفرة الآن داخل `package.json` (ابدأ بـ `npm run android:sync`). لا تعدل مجلد `android/` يدوياً إلا من داخل Android Studio أو من خلال أوامر `npx cap ...` للحفاظ على التزامن.
