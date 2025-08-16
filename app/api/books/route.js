import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

export const GET = async (request) => {
  const supabase = createClient(); // Instantiate supabase client
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || '';
  const ids = searchParams.get('ids');
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10; // Default limit to 10
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;

  try {
    // First query: Get the total count
    let countQuery = supabase.from('books').select('count', { count: 'exact' });

    if (query) {
      countQuery = countQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      countQuery = countQuery.eq('category', category);
    }
    if (author) {
      countQuery = countQuery.ilike('author', `%${author}%`);
    }
    if (ids) {
      const bookIds = ids.split(',');
      countQuery = countQuery.in('id', bookIds);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(countError.message);
    }

    // Second query: Get the paginated data
    let dataQuery = supabase.from('books').select('*');

    if (query) {
      dataQuery = dataQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      dataQuery = dataQuery.eq('category', category);
    }
    if (author) {
      dataQuery = dataQuery.ilike('author', `%${author}%`);
    }
    if (ids) {
      const bookIds = ids.split(',');
      dataQuery = dataQuery.in('id', bookIds);
    }

    dataQuery = dataQuery.range(startIndex, endIndex);

    const { data: books, error: fetchError } = await dataQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return new NextResponse(JSON.stringify(books), {
      status: 200,
      headers: {
        'X-Total-Count': count,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/books:', error);
    return NextResponse.json({ message: 'فشل في جلب الكتب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
};

export const POST = protect(admin(async (request) => {
  const supabase = createClient(); // Instantiate supabase client
  const body = await request.json();


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
      console.error('Supabase insert error:', insertError);
      throw new Error(insertError.message);
    }
    

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books (catch block):', error);
    return NextResponse.json({ message: 'فشل في إنشاء الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
}));