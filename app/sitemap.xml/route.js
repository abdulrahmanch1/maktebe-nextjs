import { createClient } from '@/utils/supabase/server';

const URL = 'https://www.dar-alqurra.com';

export async function GET() {
  const supabase = await createClient();
  const { data: books, error } = await supabase
    .from('books')
    .select('id, updated_at')
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching books for sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }

  const bookEntries = books.map(({ id, updated_at }) => ({
    url: `${URL}/book/${id}`,
    lastModified: new Date(updated_at).toISOString(),
  }));

  const staticRoutes = [
    { url: URL, lastModified: new Date().toISOString() },
    { url: `${URL}/login`, lastModified: new Date().toISOString() },
    { url: `${URL}/register`, lastModified: new Date().toISOString() },
    { url: `${URL}/suggest-book`, lastModified: new Date().toISOString() },
  ];

  const allRoutes = [...staticRoutes, ...bookEntries];

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes
    .map(
      (route) => `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${route.lastModified}</lastmod>
    </url>
  `
    )
    .join('')}
</urlset>`;

  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
