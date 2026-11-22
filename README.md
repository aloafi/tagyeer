# منصة تغيير — TAGYEER

تطبيق صفحة واحدة (SPA) بـ React و React Router، يخدم واجهتين من الأصل نفسه:
واجهة المشارك وواجهة لوحة التحكم.

## التشغيل

```bash
npm install
npm run dev      # خادم تطوير على المنفذ 5173
npm run build    # بناء الإنتاج إلى dist/
npm run preview  # معاينة ناتج البناء
```

## المسارات

| المسار | الصفحة | الوصول |
|---|---|---|
| `/` | دخول المشارك برمز الجلسة | عام |
| `/join/:code` | الدخول برمز جاهز (رابط QR) | عام |
| `/play/:code` | تشغيل التجربة والنتيجة | عام |
| `/login` | تسجيل دخول المسؤول | عام |
| `/dashboard` | نظرة عامة | محمي |
| `/quizzes` | قائمة التجارب | محمي |
| `/quizzes/new` · `/quizzes/:id/edit` | محرر التجربة | محمي |
| `/sessions` | مركز الجلسات (الفلاتر في الرابط) | محمي |
| `/sessions/:code` | تفاصيل الجلسة — نظرة عامة | محمي |
| `/sessions/:code/participants` | المشاركون | محمي |
| `/sessions/:code/analytics` | التحليلات | محمي |
| `/sessions/:code/matrix` | مصفوفة الجهات | محمي |
| `/sessions/:code/answers` | إجابات التعبير | محمي |
| `/sessions/:code/settings` | إعدادات الجلسة | محمي |
| `/projection/:code` | شاشة العرض | محمي |
| `/settings` | إعدادات المنصة | محمي |
| أي مسار آخر | صفحة 404 | عام |

الروابط القديمة `/?c=ABC123` ما زالت تعمل، فرموز QR المطبوعة سابقاً لا تتعطّل.

## البنية

```
src/
  lib/          الوصول للبيانات والأدوات الخالصة (api, analytics, format, csv, links, storage, auth)
  hooks/        حالة مشتركة (بيانات اللوحة، إنشاء جلسة، عنوان الصفحة)
  components/   لبنات واجهة قابلة لإعادة الاستخدام (ui, charts, participant)
  layouts/      AdminLayout: القائمة الجانبية وترويسة الصفحة
  pages/        صفحة لكل مسار — admin / admin/session / public
  styles/       الأنماط الأصلية محصورة تحت .admin-root و .participant-root
  routes.jsx    جدول المسارات وحارس الدخول
```

## الأنماط

`admin.css` و `participant.css` هما ملفا الأنماط الأصليان بلا تعديل في الهوية.
يحوّلهما `scope-css.mjs` إلى `*.scoped.css` بحصر كل محدّد تحت صنف جذر،
فتتعايش الواجهتان في تطبيق واحد دون تضارب.

```bash
node scope-css.mjs src/styles/admin.css src/styles/admin.scoped.css ".admin-root"
node scope-css.mjs src/styles/participant.css src/styles/participant.scoped.css ".participant-root"
```

الهوية ثابتة: الأخضر `#0B4F3A`، الذهبي `#B8892B`، خط IBM Plex Sans Arabic، واتجاه RTL.

## الأمان

لا توجد أسرار في شيفرة الواجهة سوى مفتاح Supabase العام (anon) المخصّص للمتصفح.
كل صلاحيات الإدارة تُتحقَّق داخل دوال قاعدة البيانات، وإخفاء عناصر الواجهة ليس حمايةً بحد ذاته.
