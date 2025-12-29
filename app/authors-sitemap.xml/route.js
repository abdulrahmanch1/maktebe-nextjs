import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 hours

export async function GET() {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    // Fetch all authors
    const { data: authors } = await supabase
        .from('authors')
        .select('id, name, updated_at, created_at')
        .order('updated_at', { ascending: false });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${authors?.map(author => `
  <url>
    <loc>${baseUrl}/author/${author.id}</loc>
    <lastmod>${new Date(author.updated_at || author.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('') || ''}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        }
    });
}
