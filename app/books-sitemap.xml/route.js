import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    // Fetch all approved books
    const { data: books } = await supabase
        .from('books')
        .select('id, title, author, category, updated_at, created_at')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${books?.map(book => `
  <url>
    <loc>${baseUrl}/book/${book.id}</loc>
    <lastmod>${new Date(book.updated_at || book.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
    });
}
