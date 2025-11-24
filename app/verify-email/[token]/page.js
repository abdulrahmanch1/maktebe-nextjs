import VerifyEmailPageClient from './VerifyEmailPageClient';

export const metadata = {
  title: 'تأكيد البريد الإلكتروني | مكتبة دار القرَاء',
  description: 'تأكيد بريدك الإلكتروني لإتمام إنشاء الحساب في دار القرَاء.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/verify-email',
  },
};

export default function VerifyEmailPage({ params }) {
  return <VerifyEmailPageClient token={params.token} />;
}
