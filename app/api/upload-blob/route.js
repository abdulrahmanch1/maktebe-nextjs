import { handleUpload } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const jsonResponse = await handleUpload({
      request,
      // You can add a handleUpload.beforeUpload hook here for validation or custom filename generation
      // For example:
      // handleUpload.beforeUpload: async (pathname, clientPayload) => {
      //   // Generate a unique filename or validate
      //   const filename = `${Date.now()}-${pathname}`;
      //   return { pathname: filename };
      // },
      // handleUpload.onUploadCompleted: async ({ blob, clientPayload }) => {
      //   // Do something with the blob, e.g., save URL to database
      //   console.log('Blob upload completed', blob, clientPayload);
      // },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}