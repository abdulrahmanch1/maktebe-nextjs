import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';

export const POST = protect(async (request) => {
  const supabase = await createClient();
  
  try {
    // 1. Get the JSON data from the request
    const bookData = await request.json();

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
