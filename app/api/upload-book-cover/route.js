import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { uploadFile } from '@/utils/supabase/storage';
import { createClient } from '@/utils/supabase/server';

export const POST = protect(admin(async (request) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    const supabase = await createClient();
    const newUrl = await uploadFile(supabase, 'book-covers', file, ['image/jpeg', 'image/png', 'image/webp']);

    return NextResponse.json({
      message: 'Cover uploaded successfully',
      newUrl: newUrl,
    });
  } catch (error) {
    console.error('Book cover upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));
