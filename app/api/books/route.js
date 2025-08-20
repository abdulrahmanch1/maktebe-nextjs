import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { validateBook, isValidUUID } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

export const GET = async (request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role === 'admin') {
      isAdmin = true;
    }
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || '';
  const ids = searchParams.get('ids');
  const status = searchParams.get('status');

  try {
    let supabaseQuery = supabase.from('books').select('*');

    // Filter by status
    if (isAdmin && status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    } else {
      // By default, or for non-admins, only return approved books
      supabaseQuery = supabaseQuery.eq('status', 'approved');
    }

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
      const bookIds = ids.split(',').filter(id => isValidUUID(id));
      if (bookIds.length === 0) {
        // If no valid UUIDs are found, return an empty array to prevent querying with invalid IDs
        return NextResponse.json([]);
      }
      supabaseQuery = supabaseQuery.in('id', bookIds);
    }

    const { data: books, error: fetchError } = await supabaseQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    
    return NextResponse.json(books);
  } catch (error) {
    console.error('Error in GET /api/books:', error);
    return NextResponse.json({ message: 'فشل في جلب الكتب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
};

export const POST = protect(admin(async (request) => {
  const supabase = await createClient(); // Instantiate supabase client
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