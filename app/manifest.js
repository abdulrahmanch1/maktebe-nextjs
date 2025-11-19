export default function manifest() {
  return {
    name: 'دار القراء',
    short_name: 'دار القراء',
    description: 'استكشف مكتبة دار القراء واقرأ آلاف الكتب العربية في أي وقت ومن أي جهاز.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    background_color: '#041d29',
    theme_color: '#0a3f54',
    lang: 'ar',
    dir: 'rtl',
    categories: ['books', 'education', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/imgs/no_cover_available.png',
        sizes: '800x1200',
        type: 'image/png',
        form_factor: 'wide',
        label: 'صفحة تفاصيل الكتاب',
      },
    ],
  };
}
