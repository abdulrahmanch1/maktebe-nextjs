# تعليمات تشغيل قاعدة البيانات

## الملفات الموجودة

الآن عندك ملفين SQL فقط في `/supabase/migrations/`:

1. **`01_schema.sql`** - الجداول والأعمدة
   - كل الجداول (profiles, books, comments, favorites, reading_list, suggested_books, message_threads, thread_messages, analytics_events)
   - كل الـ indexes
   - كل الـ functions و triggers

2. **`02_security.sql`** - الحماية (RLS Policies)
   - كل سياسات الأمان لكل الجداول
   - من يقدر يشوف ويعدل ويمسح البيانات

## كيف تشغلهم على Supabase

### الطريقة 1: عبر Dashboard (الأسهل)

1. افتح Supabase Dashboard
2. اذهب إلى **SQL Editor**
3. **أولاً**: انسخ محتوى `01_schema.sql` والصقه وشغله (Run)
4. **ثانياً**: انسخ محتوى `02_security.sql` والصقه وشغله (Run)

⚠️ **مهم**: شغل `01_schema.sql` أولاً، بعدين `02_security.sql`

### الطريقة 2: عبر CLI

```bash
cd /home/sr-fswd/maktebe-nextjs
supabase db push
```

## الجداول اللي رح تنشأ

✅ **profiles** - معلومات المستخدمين
✅ **books** - الكتب
✅ **comments** - التعليقات
✅ **comment_likes** - إعجابات التعليقات
✅ **favorites** - المفضلة
✅ **reading_list** - قائمة القراءة
✅ **suggested_books** - اقتراحات الكتب
✅ **contact_messages** - رسائل الاتصال القديمة
✅ **message_threads** - محادثات الدعم الجديدة
✅ **thread_messages** - رسائل المحادثات
✅ **analytics_events** - إحصائيات الموقع

## بعد التشغيل

بعد ما تشغل الملفين، نظام الرسائل الجديد رح يشتغل 100%! 

المستخدم يقدر:
- يفتح Settings → رسائل الدعم
- يكتب رسالة مباشرة
- يشوف الرسائل بشكل دردشة (رسائله يمين، المسؤول يسار)

## ملاحظات

- الملفات القديمة انمسحت (complete_database_setup.sql, final_database_setup.sql, etc.)
- كل شي منظم في ملفين بس
- سهل التعديل والصيانة مستقبلاً
