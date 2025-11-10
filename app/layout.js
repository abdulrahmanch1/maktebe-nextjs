import { Providers } from '@/contexts/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeBodyStyle from '@/components/ThemeBodyStyle';
import DynamicChatAssistant from '@/components/DynamicChatAssistant';
import Script from 'next/script';
import '@/app/globals.css';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'مكتبة الكتب | تصفح واقرأ آلاف الكتب والروايات',
  description: 'دار القرَاء، مكتبة كتب عربية شاملة. تصفح، ابحث، واقرأ آلاف الكتب والروايات في مختلف التصنيفات. انضم إلينا واستمتع بتجربة قراءة فريدة.',
  keywords: 'مكتبة كتب, كتب عربية, قراءة كتب, تحميل كتب, كتب إلكترونية, روايات عربية, قصص, أدب عربي, كتب دينية, كتب تاريخية, كتب علمية, مكتبة إلكترونية, كتب مجانية, قراءات, ثقافة, معرفة',
  author: 'Abdulrahman Chibon',
  icons: {
    icon: '/favicon.png',
  },
};

import '@/components/MainLayout.css';

export default async function RootLayout({ children }) {  const cookieStore = await cookies();
  const themeName = cookieStore.get('themeName')?.value || 'theme2'; // Default to theme2


  return (
    <html lang="ar" dir="rtl">
      <meta name="google-site-verification" content="bsBB43qfT1FPKaWwZ_HeLlmhodeWwL0jakSb-Yyq2o8" />
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
            <div className="main-layout">
              <Header />
              <main className="main-content">{children}</main>
              <Footer />
            </div>
            </ThemeBodyStyle>
            <DynamicChatAssistant />
        </Providers>
      </body>
    </html>
  );
}