import LoginPageClient from './LoginPageClient';

export const metadata = {
  title: 'تسجيل الدخول | مكتبة دار القرَاء',
  description: 'سجّل دخولك للوصول إلى مكتبتك والمفضلة وقائمة القراءة في دار القرَاء.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
