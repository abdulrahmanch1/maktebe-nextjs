import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const PATCH = protect(admin(async (request, props) => {
  const supabase = await createClient();
  const { id } = props.params;

  if (!id) {
    return NextResponse.json({ message: 'Book ID is required' }, { status: 400 });
  }

  try {
    // Check if the book exists and is pending
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ message: 'الكتاب غير موجود' }, { status: 404 });
    }

    if (book.status !== 'pending') {
      return NextResponse.json({ message: 'هذا الكتاب ليس في حالة انتظار للموافقة' }, { status: 400 });
    }

    // Update the book's status to 'approved'
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ message: 'فشل الموافقة على الكتاب.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تمت الموافقة على الكتاب بنجاح!', book: updatedBook });
  } catch (error) {
    console.error('Error in /api/books/[id]/approve PATCH:', error);
    return NextResponse.json({ message: 'حدث خطأ غير متوقع.' }, { status: 500 });
  }
}));
