export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/settings/', '/login', '/register', '/suggest-book/'],
        },
        sitemap: 'https://www.dar-alqurra.com/sitemap.xml',
    };
}
