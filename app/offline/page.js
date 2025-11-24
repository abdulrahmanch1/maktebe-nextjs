import Link from 'next/link';
import './offline.css';

export const metadata = {
  title: 'أنت غير متصل | مكتبة دار القرَاء',
  description: 'صفحة عدم الاتصال: حاول مجدداً بعد استعادة الإنترنت.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/offline',
  },
};

const OfflinePage = () => {
  return (
    <div className="offline-wrapper">
      <div className="offline-card">
        <h1>أنت غير متصل</h1>
        <p>لا يمكن تحميل المحتوى حالياً. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.</p>
        <Link href="/" className="offline-link">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
};

export default OfflinePage;
