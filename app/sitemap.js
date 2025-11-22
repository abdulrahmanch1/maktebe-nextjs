import { createClient } from '@/utils/supabase/server';

export default async function sitemap() {
    const supabase = await createClient();
    const baseUrl = 'https://www.dar-alqurra.com';

    // Fetch all approved books
    const { data: books } = await supabase
        .from('books')
        .select('id, updated_at')
        .eq('status', 'approved');

    const bookUrls = books
        ? books.map((book) => ({
            url: `${baseUrl}/book/${book.id}`,
            lastModified: new Date(book.updated_at || new Date()),
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
            priority: 0.7,
        },
        {
            url: `${baseUrl}/reading-list`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/suggest-book`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...bookUrls,
    ];
}
