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
  const topFavorited = searchParams.get('topFavorited');
  const topRead = searchParams.get('topRead'); // New parameter
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const limit = limitParam ? parseInt(limitParam, 10) : null;
  const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;

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
        return NextResponse.json([], {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      supabaseQuery = supabaseQuery.in('id', bookIds);
    }

    // Handle topRead (precedence over topFavorited if both are true)
    if (topRead === 'true') {
      supabaseQuery = supabaseQuery.order('readcount', { ascending: false });
    } else if (topFavorited === 'true') { // Handle topFavorited only if topRead is not true
      supabaseQuery = supabaseQuery.order('favoritecount', { ascending: false });
    }

    if (limit && limit > 0) {
      const start = offset || 0;
      const end = start + limit - 1;
      supabaseQuery = supabaseQuery.range(start, end);
    }

    const { data: books, error: fetchError } = await supabaseQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    
    return NextResponse.json(books, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/books:', error);
    return NextResponse.json({ message: 'فشل في جلب الكتب. يرجى المحاولة مرة أخرى.' }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
};

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomCounts(ratingTier) {
  let favoriteMin, favoriteMax, readMin, readMax;

  switch (ratingTier) {
    case 'medium':
      favoriteMin = 15; favoriteMax = 30;
      readMin = 10; readMax = 20;
      break;
    case 'excellent':
      favoriteMin = 30; favoriteMax = 45;
      readMin = 15; readMax = 25; // Excellent for reads
      break;
    case 'very_good': // Assuming this is a separate tier for reads
      favoriteMin = 50; favoriteMax = 70; 
      readMin = 40; readMax = 55;
      break;
    case 'normal':
    default:
      favoriteMin = 5; favoriteMax = 15;
      readMin = 5; readMax = 10;
      break;
  }

  return {
    favoritecount: getRandomNumber(favoriteMin, favoriteMax),
    readcount: getRandomNumber(readMin, readMax)
  };
}

export const POST = protect(admin(async (request) => {
  const supabase = await createClient(); // Instantiate supabase client
  const body = await request.json();

  const { title, author, category, description, pages, publishYear, language, keywords, cover, pdfFile, status, favoritecount, readcount } = body;

  // Check for duplicate title (case-insensitive)
  const { data: existingBook, error: existingBookError } = await supabase
    .from('books')
    .select('title')
    .ilike('title', title)
    .single();

  if (existingBook) {
    return NextResponse.json({ message: 'يوجد كتاب بهذا العنوان بالفعل.' }, { status: 409 });
  }

  if (existingBookError && existingBookError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is not an error in this case.
    // We log other errors.
    console.error('Error checking for existing book:', existingBookError);
    return NextResponse.json({ message: 'خطأ أثناء التحقق من وجود الكتاب.' }, { status: 500 });
  }

  const bookData = {
    title,
    author,
    category,
    description,
    pages: parseInt(pages),
    publishYear: parseInt(publishYear),
    language,
    keywords: keywords || [],
    cover,
    pdfFile,
    status: status || 'approved',
    favoritecount: favoritecount || 0,
    readcount: readcount || 0,
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
