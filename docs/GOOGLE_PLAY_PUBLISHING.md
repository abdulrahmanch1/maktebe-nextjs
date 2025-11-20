# دليل نشر التطبيق على Google Play

## الطريقة الموصى بها: Capacitor (جاهز عندك!)

### الخطوات:

#### 1. بناء الموقع للإنتاج
```bash
npm run build
```

#### 2. نسخ الملفات لمشروع Android
```bash
npx cap sync android
```

#### 3. فتح المشروع في Android Studio
```bash
npx cap open android
```

#### 4. في Android Studio:

**أ. إنشاء Keystore (مرة واحدة فقط):**
1. اذهب إلى: `Build` > `Generate Signed Bundle / APK`
2. اختر `Android App Bundle`
3. اضغط `Create new...` لإنشاء Keystore جديد
4. املأ المعلومات:
   - **Key store path**: اختر مكان الحفظ (مثلاً: `~/dar-alqurra-keystore.jks`)
   - **Password**: كلمة مرور قوية (احفظها!)
   - **Alias**: `dar-alqurra`
   - **Validity**: 25 سنة
   - **Certificate**:
     - First and Last Name: `Abdulrahman Chibon`
     - Organization: `Dar Al-Qurra`
     - City: مدينتك
     - Country: بلدك

**⚠️ مهم جداً:** احفظ ملف الـ Keystore وكلمة المرور في مكان آمن! إذا ضاعوا، ما رح تقدر تحدث التطبيق أبداً.

**ب. بناء App Bundle:**
1. اختر `release` من القائمة
2. حدد الـ Keystore اللي أنشأته
3. أدخل كلمة المرور
4. اضغط `Finish`

**النتيجة:** ملف `.aab` رح يكون في:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 5. رفع التطبيق على Google Play Console

### أ. إنشاء حساب Google Play Console
1. اذهب إلى: https://play.google.com/console
2. سجل حساب جديد (رسوم $25 مرة واحدة)
3. اقبل الشروط والأحكام

### ب. إنشاء تطبيق جديد
1. اضغط `Create app`
2. املأ المعلومات:
   - **App name**: دار القرَاء
   - **Default language**: Arabic (العربية)
   - **App or game**: App
   - **Free or paid**: Free

### ج. ملء معلومات التطبيق

#### 1. Store Listing (معلومات المتجر)
استخدم المعلومات من ملف `docs/ASO_METADATA.md`:

- **App name**: دار القرَاء - مكتبة كتب عربية
- **Short description**: (من الملف)
- **Full description**: (من الملف)
- **App icon**: 512x512 px (استخدم `/public/icons/icon-512.png`)
- **Feature graphic**: 1024x500 px (صمم واحد أو استخدم Canva)
- **Screenshots**: 
  - Phone: على الأقل 2 صور (يفضل 8)
  - Tablet: اختياري
  - استخدم الدليل من `ASO_METADATA.md`

- **Categorization**:
  - **Category**: Books & Reference
  - **Tags**: كتب، قراءة، مكتبة

- **Contact details**:
  - **Email**: support@dar-alqurra.com
  - **Website**: https://www.dar-alqurra.com
  - **Privacy policy**: https://www.dar-alqurra.com/privacy-policy

#### 2. Content Rating
1. اضغط `Start questionnaire`
2. اختر `Books & Reference`
3. أجب على الأسئلة (كلها "لا" غالباً)
4. احصل على تصنيف PEGI 3

#### 3. Target Audience
- **Age**: 13+ (أو حسب محتوى الكتب)

#### 4. News App
- اختر "No"

#### 5. COVID-19 Contact Tracing
- اختر "No"

#### 6. Data Safety
- أجب على الأسئلة حسب بياناتك المجمعة
- إذا ما عندك جمع بيانات، اختر "No data collected"

#### 7. Government Apps
- اختر "No"

### د. إعداد الإصدار

#### 1. Production Track
1. اذهب إلى `Production` > `Create new release`
2. ارفع ملف `.aab`
3. املأ:
   - **Release name**: 1.0.0
   - **Release notes**: (اكتب ملاحظات الإصدار بالعربية)
   
```
الإصدار الأول من دار القرَاء!

✨ الميزات:
• تصفح آلاف الكتب العربية
• قراءة مريحة مع وضع ليلي
• قائمة قراءة ذكية
• تحميل للقراءة بدون إنترنت
• بحث متقدم
• مكتبة المفضلة
```

4. اضغط `Save` ثم `Review release`

### هـ. المراجعة والنشر
1. راجع جميع المعلومات
2. اضغط `Start rollout to Production`
3. انتظر المراجعة من Google (عادة 1-3 أيام)

---

## 6. بعد النشر

### أ. مراقبة الأداء
- راقب التقييمات والتعليقات يومياً
- رد على جميع التعليقات خلال 24-48 ساعة

### ب. التحديثات
عند كل تحديث:
1. زود رقم الإصدار في `android/app/build.gradle`:
```gradle
versionCode 2  // زود الرقم
versionName "1.0.1"  // غير النسخة
```
2. ابني `.aab` جديد
3. ارفعه على Google Play Console

---

## ملاحظات مهمة

### ✅ قبل النشر تأكد من:
- [ ] الموقع يعمل على HTTPS
- [ ] manifest.json صحيح
- [ ] جميع الأيقونات موجودة
- [ ] Privacy Policy موجودة
- [ ] Screenshots جاهزة
- [ ] Keystore محفوظ في مكان آمن

### ⚠️ أخطاء شائعة:
- **فقدان Keystore**: احفظه في مكان آمن + نسخة احتياطية
- **نسيان زيادة versionCode**: كل إصدار يحتاج رقم أكبر
- **عدم الرد على التعليقات**: يؤثر على الترتيب

---

## مساعدة إضافية

### إذا واجهت مشاكل:
1. **Android Studio لا يفتح**: تأكد من تثبيت Android SDK
2. **Build فشل**: نظف المشروع: `Build` > `Clean Project`
3. **Keystore ضاع**: للأسف، ما في حل - لازم تنشئ تطبيق جديد

### روابط مفيدة:
- Google Play Console: https://play.google.com/console
- Capacitor Docs: https://capacitorjs.com/docs/android
- Android Studio: https://developer.android.com/studio
