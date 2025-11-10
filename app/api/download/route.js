import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';

const allowedDownloadHosts = (() => {
  const hosts = new Set(['public.blob.vercel-storage.com']);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const { hostname } = new URL(supabaseUrl);
      hosts.add(hostname);
    } catch (err) {
      console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL, skipping hostname allowlist.');
    }
  }
  return hosts;
})();

export const GET = protect(async (request) => {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('fileUrl');

  if (!fileUrl) {
    return new NextResponse('File URL is required', { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(fileUrl);
  } catch {
    return new NextResponse('Invalid file URL', { status: 400 });
  }

  if (targetUrl.protocol !== 'https:') {
    return new NextResponse('Only HTTPS links are allowed', { status: 400 });
  }

  if (!allowedDownloadHosts.has(targetUrl.hostname)) {
    return new NextResponse('Host is not allowed', { status: 403 });
  }

  try {
    const fileResponse = await fetch(targetUrl.toString());

    if (!fileResponse.ok) {
      return new NextResponse('Failed to fetch the file', { status: fileResponse.status });
    }

    const fileBlob = await fileResponse.blob();
    const fileName = targetUrl.pathname.split('/').pop()?.split('?')[0] || 'book.pdf';

    const headers = new Headers();
    headers.append('Content-Type', fileResponse.headers.get('Content-Type') || 'application/octet-stream');
    headers.append('Content-Disposition', `attachment; filename="${fileName}"`);

    return new Response(fileBlob, { headers });
  } catch (error) {
    console.error('Download proxy error:', error);
    return new NextResponse('An internal error occurred', { status: 500 });
  }
});
