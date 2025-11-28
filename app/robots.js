export default function robots() {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api', '/suggest-book', '/offline', '/verify-email'],
            },
            {
                userAgent: ['GPTBot', 'Google-Extended', 'CCBot', 'FacebookBot'],
                allow: '/',
            }
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
