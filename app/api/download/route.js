import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('fileUrl');

  if (!fileUrl) {
    return new NextResponse('File URL is required', { status: 400 });
  }

  try {
    // Fetch the file from the provided URL
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return new NextResponse('Failed to fetch the file', { status: fileResponse.status });
    }

    // Get the file content as a Blob
    const fileBlob = await fileResponse.blob();

    // Extract the original filename from the URL
    const fileName = fileUrl.split('/').pop().split('?')[0] || 'book.pdf';

    // Create new headers to force download
    const headers = new Headers();
    headers.append('Content-Type', 'application/pdf');
    headers.append('Content-Disposition', `attachment; filename="${fileName}"`);

    // Return the new response with the file content and download headers
    return new Response(fileBlob, { headers });

  } catch (error) {
    console.error('Download proxy error:', error);
    return new NextResponse('An internal error occurred', { status: 500 });
  }
}
