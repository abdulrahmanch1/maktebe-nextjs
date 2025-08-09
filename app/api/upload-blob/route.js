import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs/promises'; // Import fs.promises for file operations

// This is crucial for formidable to work with Next.js API routes
export const config = {
  api: {
    bodyParser: false, // Disable Next.js's body parser for formidable
  },
};

export async function POST(request) {
  try {
    const form = new IncomingForm();
    const [fields, files] = await form.parse(request);

    let uploadedFile = null;
    // Find the first file in the files object (assuming only one file is sent per request)
    for (const key in files) {
      if (Array.isArray(files[key]) && files[key].length > 0) {
        uploadedFile = files[key][0];
        break;
      }
    }

    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Read the temporary file content created by formidable
    const fileBuffer = await fs.readFile(uploadedFile.filepath);

    // Use put to upload the file to Vercel Blob Storage
    const blob = await put(uploadedFile.originalFilename || uploadedFile.newFilename, fileBuffer, {
      access: 'public',
      contentType: uploadedFile.mimetype,
    });

    // Clean up the temporary file created by formidable
    await fs.unlink(uploadedFile.filepath);

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file.' }, { status: 400 });
  }
}