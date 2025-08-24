import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';

export const POST = protect(async (request) => {
  const supabase = await createClient();
  
  try {
    // 1. Get the JSON data from the request
    const bookData = await request.json();

    // Check for duplicate title (case-insensitive) in the books table
    const { data: existingBook, error: existingBookError } = await supabase
      .from('books')
      .select('title, status')
      .ilike('title', bookData.title)
      .single();

    if (existingBook) {
      if (existingBook.status === 'approved') {
        return NextResponse.json({ message: 'هذا الكتاب موجود بالفعل في المكتبة.' }, { status: 409 });
      } else if (existingBook.status === 'pending') {
        return NextResponse.json({ message: 'تم اقتراح هذا الكتاب بالفعل وهو قيد المراجعة.' }, { status: 409 });
      }
    }

    if (existingBookError && existingBookError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is not an error here.
      console.error('Error checking for existing book suggestion:', existingBookError);
      return NextResponse.json({ message: 'خطأ أثناء التحقق من الاقتراحات الحالية.' }, { status: 500 });
    }

    // 2. Add server-side data (user_id, status)
    bookData.user_id = request.user.id;
    bookData.status = 'pending';

    // 3. Validate the final book data
    const errors = validateBook(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // 4. Insert the final record into the database
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error (suggest):', insertError);
      // Note: We can't easily delete files here anymore if the insert fails,
      // because we only have the URL. This would require more complex logic
      // to parse the URL and call storage.remove. For now, we accept this.
      throw new Error(insertError.message);
    }

    return NextResponse.json(newBook, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/books/suggest:', error);
    // Check if the error is a JSON parsing error
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format.' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'فشل في اقتراح الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
});
