import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const PATCH = protect(admin(async (request, { params }) => {
  const supabase = createClient();
  const { id } = params;
  const { status } = await request.json(); // Expecting status: 'approved' or 'rejected'

  try {
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({ status: status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ message: 'فشل تحديث حالة الكتاب المقترح.' }, { status: 500 });
    }

    if (!updatedBook) {
      return NextResponse.json({ message: 'الكتاب المقترح غير موجود.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم تحديث حالة الكتاب بنجاح.', book: updatedBook });
  } catch (error) {
    console.error('Error in /api/suggested-books/[id] PATCH:', error);
    return NextResponse.json({ message: 'حدث خطأ غير متوقع.' }, { status: 500 });
  }
}));

export const DELETE = protect(admin(async (request, { params }) => {
  const supabase = createClient();
  const { id } = params;

  try {
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json({ message: 'فشل حذف الكتاب المقترح.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف الكتاب المقترح بنجاح.' });
  } catch (error) {
    console.error('Error in /api/suggested-books/[id] DELETE:', error);
    return NextResponse.json({ message: 'حدث خطأ غير متوقع.' }, { status: 500 });
  }
}));
