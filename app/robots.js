export default function robots() {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/api', '/settings', '/login', '/register', '/suggest-book', '/offline', '/verify-email'],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
