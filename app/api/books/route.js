import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || '';
  const ids = searchParams.get('ids');

  try {
    let supabaseQuery = supabase.from('books').select('*');

    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }
    if (author) {
      supabaseQuery = supabaseQuery.ilike('author', `%${author}%`);
    }
    if (ids) {
      const bookIds = ids.split(',');
      supabaseQuery = supabaseQuery.in('id', bookIds);
    }

    const { data: books, error: fetchError } = await supabaseQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error in GET /api/books:', error);
    return NextResponse.json({ message: `Failed to fetch books: ${error.message}` }, { status: 500 });
  }
};

export const POST = protect(admin(async (request) => {
  console.log('--- Starting POST /api/books ---');
  const body = await request.json();
  console.log('Received book data body:', body);

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
  };
  console.log('Parsed bookData:', bookData);

  const errors = validateBook(bookData);
  if (Object.keys(errors).length > 0) {
    console.log('Validation failed:', errors);
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }
  console.log('Validation passed.');

  try {
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error(insertError.message);
    }
    console.log('Book inserted successfully:', newBook);

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books (catch block):', error);
    return NextResponse.json({ message: `فشل إنشاء الكتاب: ${error.message}` }, { status: 500 });
  }
}));