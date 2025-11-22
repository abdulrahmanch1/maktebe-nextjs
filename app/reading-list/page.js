import ReadingListClient from './ReadingListClient';

export const metadata = {
  title: 'قائمة القراءة | مكتبة دار القرَاء',
  description: 'تصفح قائمة القراءة الخاصة بك في مكتبة دار القرَاء. تابع الكتب التي تخطط لقراءتها قريباً.',
  alternates: {
    canonical: '/reading-list',
  },
};

export default function ReadingListPage() {
  return <ReadingListClient />;
}
