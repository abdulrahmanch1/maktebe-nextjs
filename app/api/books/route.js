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

  const { title, author, category, description, pages, publishYear, language, keywords, cover, pdfFile, status, ratingTier } = body; // Added status and ratingTier

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
    status: status || 'approved', // Default to approved if not provided
  };

  // Generate random likes and reads if status is 'approved'
  if (bookData.status === 'approved') {
    const { favoritecount, readcount } = generateRandomCounts(ratingTier || 'normal'); // Use ratingTier or default to 'normal'
    bookData.favoritecount = favoritecount;
    bookData.readcount = readcount;
  } else {
    // If not approved, set counts to 0
    bookData.favoritecount = 0;
    bookData.readcount = 0;
  }

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