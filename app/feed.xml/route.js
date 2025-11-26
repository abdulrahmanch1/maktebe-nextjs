import { createClient } from '@/utils/supabase/server';


export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

  // Fetch latest 50 books
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, description, cover, created_at, category')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>مكتبة دار القرّاء - أحدث الكتب</title>
    <link>${baseUrl}</link>
    <description>أحدث الكتب والروايات المضافة إلى مكتبة دار القرّاء</description>
    <language>ar</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${books?.map(book => `
    <item>
      <title><![CDATA[${book.title} - ${book.author}]]></title>
      <link>${baseUrl}/book/${book.id}</link>
      <guid isPermaLink="true">${baseUrl}/book/${book.id}</guid>
      <pubDate>${new Date(book.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${book.description?.substring(0, 200) || `كتاب ${book.title} للمؤلف ${book.author}`}]]></description>
      <category>${book.category}</category>
      ${book.cover ? `<enclosure url="${book.cover}" type="image/jpeg"/>` : ''}
    </item>
    `).join('') || ''}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
