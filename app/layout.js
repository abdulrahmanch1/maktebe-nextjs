import { Providers } from '@/contexts/Providers';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { NotesProvider } from '@/contexts/NotesContext';

import ThemeBodyStyle from '@/components/ThemeBodyStyle';
import DynamicComponents from '@/components/DynamicComponents';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'مكتبة دار القرَاء - تحميل وقراءة آلاف الكتب والروايات العربية مجاناً بدون تسجيل أو إعلانات',
    template: '%s | دار القرَاء'
  },
  description: 'أكبر مكتبة كتب عربية إلكترونية مجانية. آلاف الكتب والروايات بصيغة PDF للتحميل والقراءة بدون تسجيل أو إعلانات. قارئ PDF مدمج، مساعد ذكي AI، ملاحظات متقدمة، قراءة بدون إنترنت. تصفح كتب دينية، روايات، تنمية بشرية، تاريخ، علوم، وأكثر.',
  keywords: [
    'مكتبة كتب عربية مجانية',
    'تحميل كتب PDF مجاناً',
    'قراءة كتب بدون تسجيل',
    'مكتبة بدون إعلانات',
    'قارئ PDF عربي',
    'مساعد ذكي للكتب',
    'كتب إلكترونية عربية',
    'روايات عربية مجانية',
    'كتب دينية إسلامية',
    'تحميل روايات عالمية',
    'كتب تنمية بشرية',
    'أدب عربي كلاسيكي',
    'قراءة أونلاين مجاناً',
    'تحميل كتب بدون حساب',
    'مكتبة وراق',
    'دار القراء',
    'كتب قراءة بدون نت',
    'تطبيق قراءة كتب',
    'ملاحظات على PDF',
    'AI book assistant'
  ],
  authors: [{ name: 'Abdulrahman Chibon' }],
  creator: 'Abdulrahman Chibon',
  publisher: 'دار القرَاء',
  applicationName: 'دار القراء',
  category: 'Education, Books, Library, Reading',
  classification: 'Digital Library, Arabic Books, Free eBooks',
  manifest: '/manifest.json',
  alternates: {
    canonical: siteUrl,
    types: {
      'application/rss+xml': `${siteUrl}/feed.xml`,
    },
  },
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
    title: 'مكتبة دار القرَاء - آلاف الكتب العربية المجانية بدون تسجيل',
    description: 'أكبر مكتبة كتب عربية مجانية. تحميل وقراءة آلاف الكتب والروايات بصيغة PDF بدون تسجيل أو إعلانات. قارئ مدمج، مساعد AI، ملاحظات ذكية، قراءة أوفلاين.',
    url: siteUrl,
    siteName: 'دار القرَاء',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'شعار دار القرَاء - مكتبة كتب عربية مجانية',
      },
    ],
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مكتبة دار القرَاء - كتب عربية مجانية بدون تسجيل',
    description: 'آلاف الكتب والروايات العربية المجانية. قارئ PDF مدمج، مساعد AI، بدون إعلانات، قراءة أوفلاين',
    images: ['/icons/icon-512.png'],
    creator: '@dar_alqurra',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-video-preview': -1,
    'max-snippet': -1,
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
  other: {
    'google-site-verification': 'bsBB43qfT1FPKaWwZ_HeLlmhodeWwL0jakSb-Yyq2o8',
    'ai-content-declaration': 'human-created',
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
        {/* Performance Optimization */}
        <link rel="preconnect" href="https://jldyyfkashoisxxyfhmb.supabase.co" />
        <link rel="dns-prefetch" href="https://jldyyfkashoisxxyfhmb.supabase.co" />

        {/* AI Search Engine Tags */}
        <meta name="AI-optimized" content="true" />
        <meta name="ai-friendly" content="yes" />
        <meta name="content-language" content="ar" />
        <meta name="geo.region" content="ME" />
        <meta name="geo.placename" content="Middle East" />

        {/* Enhanced Metadata for AI */}
        <meta name="subject" content="Arabic Books Library" />
        <meta name="Classification" content="Digital Library, eBooks, Arabic Literature" />
        <meta name="rating" content="General" />
        <meta name="distribution" content="Global" />
        <meta name="target" content="all" />
        <meta name="audience" content="Arabic readers, Students, Researchers" />
        <meta name="coverage" content="Worldwide" />

        {/* Theme and Display */}
        <meta name="theme-color" content="#0a3f54" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a5770" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />

        {/* Google Verification */}
        <meta name="google-site-verification" content="bsBB43qfT1FPKaWwZ_HeLlmhodeWwL0jakSb-Yyq2o8" />

        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="دار القرّاء - آخر الكتب" href="/feed.xml" />

        {/* Preload Critical Resources */}
        <link rel="preload" href="/icons/icon-192.png" as="image" type="image/png" />

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
          <OfflineProvider>
            <ThemeBodyStyle>
              <NotesProvider>
                <ConditionalLayout>{children}</ConditionalLayout>
                <DynamicComponents />
              </NotesProvider>
            </ThemeBodyStyle>
          </OfflineProvider>
        </Providers>
      </body>
    </html>
  );
}
