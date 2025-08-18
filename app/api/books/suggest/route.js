import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';

export const POST = protect(async (request) => {
  const supabase = createClient();
  const body = await request.json();

  // We can extract the suggester's ID if needed in the future
  // const userId = request.user.id; 

  const bookData = {
    title: body.title,
    author: body.author,
    category: body.category,
    description: body.description,
    pages: parseInt(body.pages),
    publishYear: parseInt(body.publishYear),
    language: body.language,
    keywords: body.keywords || [],
    cover: body.cover,
    pdfFile: body.pdfFile,
    status: 'suggested', // Explicitly set status to suggested
  };

  const errors = validateBook(bookData);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }

  try {
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error (suggest):', insertError);
      throw new Error(insertError.message);
    }

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books/suggest:', error);
    return NextResponse.json({ message: 'فشل في اقتراح الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
});
