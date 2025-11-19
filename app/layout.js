import { Providers } from '@/contexts/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeBodyStyle from '@/components/ThemeBodyStyle';
import DynamicComponents from '@/components/DynamicComponents';
import Script from 'next/script';
import '@/app/globals.css';

export const metadata = {
  title: 'مكتبة الكتب | تصفح واقرأ آلاف الكتب والروايات',
  description: 'دار القرَاء، مكتبة كتب عربية شاملة. تصفح، ابحث، واقرأ آلاف الكتب والروايات في مختلف التصنيفات. انضم إلينا واستمتع بتجربة قراءة فريدة.',
  keywords: 'مكتبة كتب, كتب عربية, قراءة كتب, تحميل كتب, كتب إلكترونية, روايات عربية, قصص, أدب عربي, كتب دينية, كتب تاريخية, كتب علمية, مكتبة إلكترونية, كتب مجانية, قراءات, ثقافة, معرفة',
  author: 'Abdulrahman Chibon',
  applicationName: 'دار القراء',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'دار القراء',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#0a3f54',
};

import '@/components/MainLayout.css';
import ConditionalLayout from '@/components/ConditionalLayout';

export default async function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="google-site-verification" content="bsBB43qfT1FPKaWwZ_HeLlmhodeWwL0jakSb-Yyq2o8" />
        <link rel="preconnect" href="https://jldyyfkashoisxxyfhmb.supabase.co" />
      </head>
      <body>
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=G-YDBSPJW01T`}
        />
        <Script strategy="lazyOnload" id="gtag-inline-script">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YDBSPJW01T');
          `}
        </Script>
        <Providers>
          <ThemeBodyStyle>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ThemeBodyStyle>
          <DynamicComponents />
        </Providers>
      </body>
    </html>
  );
}
