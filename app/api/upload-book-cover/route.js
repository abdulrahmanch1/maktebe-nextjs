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
        const coverImage = formData.get('file');
        const oldCoverUrl = formData.get('oldCoverUrl'); // Get the old cover URL

        if (!coverImage) {
            return NextResponse.json({ error: 'No cover image provided.' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Delete old cover image if it exists
        if (oldCoverUrl) {
            const oldCoverPath = getFilePathFromSupabaseUrl(oldCoverUrl, 'book-covers');
            if (oldCoverPath) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('book-covers')
                    .remove([oldCoverPath]);
                if (deleteError) {
                    console.error('Supabase storage delete error (old cover):', deleteError.message);
                    // Continue with upload even if old cover deletion fails
                }
            }
        }

        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = fileName;

        const { data, error } = await supabaseAdmin.storage
            .from('book-covers')
            .upload(filePath, coverImage, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return NextResponse.json({ error: 'Failed to upload image to Supabase.' }, { status: 500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('book-covers')
            .getPublicUrl(filePath);

        return NextResponse.json({ newUrl: publicUrlData.publicUrl }, { status: 200 });

    } catch (error) {
        console.error('Error uploading book cover:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}));
