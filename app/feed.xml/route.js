import { createClient } from '@/utils/supabase/server';


export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutes

export async function GET() {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

  // Fetch latest 100 books with more details
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, description, cover, created_at, category, pages, language, publishYear')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  const buildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>مكتبة دار القرَاء - أحدث الكتب العربية المجانية</title>
    <link>${baseUrl}</link>
    <description>أحدث الكتب والروايات العربية المضافة إلى مكتبة دار القرَاء. تحميل مجاني بصيغة PDF بدون تسجيل أو إعلانات.</description>
    <language>ar</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>30</ttl>
    <image>
      <url>${baseUrl}/icons/icon-512.png</url>
      <title>مكتبة دار القرَاء</title>
      <link>${baseUrl}</link>
    </image>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <generator>Next.js RSS Generator</generator>
    <copyright>دار القرَاء ${new Date().getFullYear()}</copyright>
    ${books?.map(book => {
    const fullDescription = book.description || `كتاب ${book.title} للمؤلف ${book.author}`;
    const shortDescription = fullDescription.substring(0, 300) + (fullDescription.length > 300 ? '...' : '');

    return `
    <item>
      <title><![CDATA[${book.title} - ${book.author}]]></title>
      <link>${baseUrl}/book/${book.id}</link>
      <guid isPermaLink="true">${baseUrl}/book/${book.id}</guid>
      <pubDate>${new Date(book.created_at).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${book.author}]]></dc:creator>
      <category><![CDATA[${book.category}]]></category>
      <description><![CDATA[${shortDescription}]]></description>
      <content:encoded><![CDATA[
        <h2>${book.title}</h2>
        <p><strong>المؤلف:</strong> ${book.author}</p>
        <p><strong>التصنيف:</strong> ${book.category}</p>
        ${book.pages ? `<p><strong>عدد الصفحات:</strong> ${book.pages}</p>` : ''}
        ${book.language ? `<p><strong>اللغة:</strong> ${book.language}</p>` : ''}
        ${book.publishYear ? `<p><strong>سنة النشر:</strong> ${book.publishYear}</p>` : ''}
        ${book.cover ? `<img src="${book.cover}" alt="غلاف كتاب ${book.title}" style="max-width: 300px; height: auto;" />` : ''}
        <p>${fullDescription}</p>
        <p><a href="${baseUrl}/book/${book.id}">قراءة وتحميل الكتاب مجاناً</a></p>
      ]]></content:encoded>
      ${book.cover ? `
      <enclosure url="${book.cover}" type="image/jpeg"/>
      <media:content url="${book.cover}" type="image/jpeg" medium="image">
        <media:title>${book.title}</media:title>
        <media:description>${book.author}</media:description>
      </media:content>
      ` : ''}
    </item>`;
  }).join('') || ''}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600'
    }
  });
}
