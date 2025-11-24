import RegisterPageClient from './RegisterPageClient';

export const metadata = {
  title: 'إنشاء حساب | مكتبة دار القرَاء',
  description: 'أنشئ حسابك في دار القرَاء للوصول إلى مكتبتك، المفضلة وقائمة القراءة.',
  alternates: {
    canonical: '/register',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
