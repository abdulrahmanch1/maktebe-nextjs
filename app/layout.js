import { Providers } from '@/contexts/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeBodyStyle from '@/components/ThemeBodyStyle';
import DynamicComponents from '@/components/DynamicComponents';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'مكتبة دار القرَاء - تحميل وقراءة آلاف الكتب والروايات العربية مجاناً',
    template: '%s | دار القرَاء'
  },
  description: 'اكتشف أكبر مكتبة كتب عربية إلكترونية. حمل واقرأ آلاف الروايات والكتب الدينية والعلمية مجاناً بصيغة PDF بدون تسجيل. تجربة قراءة ممتعة وسريعة في دار القرَاء.',
  keywords: ['مكتبة كتب', 'كتب pdf', 'تحميل كتب', 'قراءة كتب', 'روايات عربية', 'كتب إلكترونية', 'كتب دينية', 'روايات عالمية مترجمة', 'كتب تنمية بشرية', 'كتب تاريخية', 'كتب علم النفس', 'أفضل موقع لتحميل الكتب', 'قراءة روايات بدون نت', 'قراءة كتب بدون تسجيل', 'تحميل كتب بدون حساب'],
  authors: [{ name: 'Abdulrahman Chibon' }],
  creator: 'Abdulrahman Chibon',
  publisher: 'دار القرَاء',
  applicationName: 'دار القراء',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', rel: 'mask-icon' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/icon-192.png',
  },

  openGraph: {
    title: 'مكتبة دار القرَاء - تحميل وقراءة آلاف الكتب والروايات العربية مجاناً',
    description: 'اكتشف أكبر مكتبة كتب عربية إلكترونية. حمل واقرأ آلاف الروايات والكتب الدينية والعلمية مجاناً بصيغة PDF بدون الحاجة لتسجيل الدخول.',
    url: siteUrl,
    siteName: 'دار القرَاء',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'شعار دار القرَاء',
      },
    ],
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مكتبة دار القرَاء - تحميل وقراءة كتب وروايات',
    description: 'اكتشف أكبر مكتبة كتب عربية إلكترونية. حمل واقرأ آلاف الروايات والكتب الدينية والعلمية مجاناً بدون تسجيل.',
    images: ['/icons/icon-512.png'],
    creator: '@dar_alqurra',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'دار القراء',
  },
};

export const viewport = {
  themeColor: '#0a3f54',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

import '@/components/MainLayout.css';
import ConditionalLayout from '@/components/ConditionalLayout';

export default async function RootLayout({ children }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'دار القرَاء',
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-512.png`,
    sameAs: [
      'https://twitter.com/dar_alqurra',
      'https://facebook.com/dar_alqurra',
      'https://instagram.com/dar_alqurra'
    ]
  };

  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="google-site-verification" content="bsBB43qfT1FPKaWwZ_HeLlmhodeWwL0jakSb-Yyq2o8" />
        <link rel="alternate" type="application/rss+xml" title="دار القرّاء - آخر الكتب" href="/feed.xml" />
        <link rel="preconnect" href="https://jldyyfkashoisxxyfhmb.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationSchema,
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'دار القرَاء',
                url: 'https://www.dar-alqurra.com',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${siteUrl}/?search={search_term_string}`,
                  'query-input': 'required name=search_term_string'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'هل تحميل الكتب مجاني في دار القراء؟',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'نعم، جميع الكتب والروايات في مكتبة دار القراء متاحة للتحميل والقراءة مجاناً بصيغة PDF.'
                    }
                  },
                  {
                    '@type': 'Question',
                    name: 'هل أحتاج لتسجيل الدخول لقراءة الكتب؟',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'لا، يمكنك قراءة وتحميل جميع الكتب مباشرة دون الحاجة لإنشاء حساب أو تسجيل الدخول.'
                    }
                  },
                  {
                    '@type': 'Question',
                    name: 'كيف يمكنني تحميل كتاب؟',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'ببساطة ابحث عن الكتاب الذي تريده، واضغط على زر "تحميل الكتاب" في صفحة التفاصيل.'
                    }
                  }
                ]
              }
            ])
          }}
        />
      </head>
      <body>
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
