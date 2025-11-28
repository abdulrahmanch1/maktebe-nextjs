import SettingsPageClient from './SettingsPageClient';

export const metadata = {
  title: 'إعدادات الحساب | مكتبة دار القرَاء',
  description: 'حدّث بيانات حسابك، المظهر، والأمان في دار القرَاء.',
  alternates: {
    canonical: '/settings',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
