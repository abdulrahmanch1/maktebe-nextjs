import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';

// Helper function to extract file path from Supabase URL
function getFilePathFromSupabaseUrl(url, bucketName) {
  if (!url) return null;
  const parts = url.split(`/public/${bucketName}/`);
  if (parts.length > 1) {
    return parts[1].split('?')[0];
  }
  return null;
}

export const POST = protect(admin(async (request) => {
    try {
        const formData = await request.formData();
        const pdfFile = formData.get('file');
        const oldPdfUrl = formData.get('oldPdfUrl'); // Get the old PDF URL

        if (!pdfFile) {
            return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Delete old PDF file if it exists
        if (oldPdfUrl) {
            const oldPdfPath = getFilePathFromSupabaseUrl(oldPdfUrl, 'book-pdfs'); // Assuming 'book-pdfs' bucket
            if (oldPdfPath) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('book-pdfs') // Assuming 'book-pdfs' bucket
                    .remove([oldPdfPath]);
                if (deleteError) {
                    console.error('Supabase storage delete error (old PDF):', deleteError.message);
                    // Continue with upload even if old PDF deletion fails
                }
            }
        }

        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `book-pdfs/${fileName}`;

        const { data, error } = await supabaseAdmin.storage
            .from('book-pdfs') // Assuming 'book-pdfs' bucket
            .upload(filePath, pdfFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return NextResponse.json({ error: 'Failed to upload PDF to Supabase.' }, { status: 500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('book-pdfs') // Assuming 'book-pdfs' bucket
            .getPublicUrl(filePath);

        return NextResponse.json({ newUrl: publicUrlData.publicUrl }, { status: 200 });

    } catch (error) {
        console.error('Error uploading book PDF:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}));
