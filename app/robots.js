export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/settings/'],
        },
        sitemap: 'https://www.dar-alqurra.com/sitemap.xml',
    };
}
