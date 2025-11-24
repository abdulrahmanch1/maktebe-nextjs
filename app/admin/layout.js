export const metadata = {
  title: 'لوحة التحكم | مكتبة دار القرَاء',
  description: 'إدارة الكتب والمحتوى والرسائل في لوحة تحكم دار القرَاء.',
  alternates: {
    canonical: '/admin',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
  return children;
}
