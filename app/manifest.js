export default function manifest() {
  return {
    name: 'دار القرَاء - مكتبة الكتب العربية المجانية',
    short_name: 'دار القرَاء',
    description: 'أكبر مكتبة كتب عربية مجانية. تحميل وقراءة آلاف الكتب والروايات بصيغة PDF بدون تسجيل أو إعلانات. قارئ مدمج، مساعد AI، قراءة أوفلاين',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a3f54',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ar',
    dir: 'rtl',
    categories: ['books', 'education', 'lifestyle', 'productivity', 'reference'],
    icons: [
      {
        src: '/icons/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'تصفح الكتب',
        short_name: 'الكتب',
        description: 'تصفح جميع الكتب المتاحة',
        url: '/books',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'المؤلفون',
        short_name: 'المؤلفون',
        description: 'تصفح المؤلفين',
        url: '/authors',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'المفضلة',
        short_name: 'المفضلة',
        description: 'كتبك المفضلة',
        url: '/favorites',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      }
    ]
  }
}
