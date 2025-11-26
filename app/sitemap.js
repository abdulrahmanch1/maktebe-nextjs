import { createClient } from '@/utils/supabase/server';
import { slugify } from '@/utils/slugify';

export const revalidate = 3600;

export default async function sitemap() {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    // Fetch all approved books with accurate dates
    const { data: books } = await supabase
        .from('books')
        .select('id, title, cover, updated_at, created_at')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false });

    const bookUrls = books
        ? books.map((book) => ({
            url: `${baseUrl}/book/${slugify(book.title)}/${book.id}`,
            lastModified: new Date(book.updated_at || book.created_at),
            changeFrequency: 'weekly',
            priority: 0.8,
        }))
        : [];

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
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
        ...bookUrls,
    ];
}
