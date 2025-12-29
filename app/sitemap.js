import { createClient } from '@/utils/supabase/server';


export const revalidate = 3600;

export default async function sitemap() {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    // Note: Books and Authors have their own dedicated sitemaps
    // This is just the main pages sitemap

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/about-ai`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/books`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/authors`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/favorites`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/reading-list`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/feed.xml`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/books-sitemap.xml`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/authors-sitemap.xml`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ];
}
