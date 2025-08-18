import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const PATCH = protect(admin(async (request, { params }) => {
  const supabase = createClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Book ID is required' }, { status: 400 });
  }

  try {
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error (approve):', updateError);
      if (updateError.code === 'PGRST116') { // PostgREST error for no rows found
        return NextResponse.json({ message: `الكتاب بالمعرف ${id} غير موجود.` }, { status: 404 });
      }
      throw new Error(updateError.message);
    }

    return NextResponse.json(updatedBook, { status: 200 });
  } catch (error) {
    console.error(`Error in PATCH /api/books/${id}/approve:`, error);
    return NextResponse.json({ message: 'فشل في الموافقة على الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
}));
