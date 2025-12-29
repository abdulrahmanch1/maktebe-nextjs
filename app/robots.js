import { MetadataRoute } from 'next'

export default function robots() {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/verify-email/'],
            },
            // AI Crawlers - Full Access with optimized crawl delay
            {
                userAgent: ['GPTBot', 'ChatGPT-User'],
                allow: '/',
                crawlDelay: 1,
            },
            {
                userAgent: ['Google-Extended', 'GoogleOther'],
                allow: '/',
                crawlDelay: 1,
            },
            {
                userAgent: ['anthropic-ai', 'Claude-Web'],
                allow: '/',
                crawlDelay: 1,
            },
            {
                userAgent: 'PerplexityBot',
                allow: '/',
                crawlDelay: 1,
            },
            {
                userAgent: 'YouBot',
                allow: '/',
                crawlDelay: 1,
            },
            {
                userAgent: 'Applebot-Extended',
                allow: '/',
                crawlDelay: 1,
            },
            {
                userAgent: 'Bytespider',
                allow: '/',
                crawlDelay: 2,
            },
            // Social Media Crawlers
            {
                userAgent: ['facebookexternalhit', 'Facebot'],
                allow: '/',
            },
            {
                userAgent: 'Twitterbot',
                allow: '/',
            },
            {
                userAgent: 'LinkedInBot',
                allow: '/',
            },
            {
                userAgent: 'WhatsApp',
                allow: '/',
            },
            // Search Engines
            {
                userAgent: 'Googlebot',
                allow: '/',
            },
            {
                userAgent: ['Googlebot-Image', 'Googlebot-Video'],
                allow: '/',
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
            },
            {
                userAgent: 'Slurp',
                allow: '/',
            },
            {
                userAgent: 'DuckDuckBot',
                allow: '/',
            },
            {
                userAgent: 'Baiduspider',
                allow: '/',
                crawlDelay: 2,
            },
            {
                userAgent: 'YandexBot',
                allow: '/',
                crawlDelay: 2,
            },
        ],
        sitemap: [
            `${siteUrl}/sitemap.xml`,
            `${siteUrl}/books-sitemap.xml`,
            `${siteUrl}/authors-sitemap.xml`,
        ],
        host: siteUrl,
    }
}
