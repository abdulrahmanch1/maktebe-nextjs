import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { validateBook, validateBookUpdate } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

async function getBook(id) {
  const supabase = await createClient(); // Instantiate supabase client
  // Removed validateMongoId(id) call
  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return { book: null, error: { message: 'Book ID is required' } };
  }

  // Fetch the book and its comments, populating user details for comments
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, readcount, favoritecount') // Explicitly select readcount and favoritecount
    .eq('id', id)
    .single();

  if (bookError || !book) {
    return { book: null, error: { message: 'Cannot find book' } };
  }

  return { book, error: null };
}

export async function GET(request, { params }) {
  const supabase = await createClient(); // Instantiate supabase client
  const { id } = await params;
  const { book, error } = await getBook(id);

  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  return NextResponse.json(book);
}

export const PATCH = protect(admin(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { id } = await params;
  const body = await request.json();

  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    const { title, author, category, description, pages, publishYear, language, keywords, cover, pdfFile, favoritecount, readcount } = body;

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
      favoritecount,
      readcount,
    };

    const errors = validateBookUpdate(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'فشل التحقق', errors }, { status: 400 });
    }

    // Filter out undefined values to only update provided fields
    Object.keys(bookData).forEach(key => {
      if (bookData[key] === undefined) {
        delete bookData[key];
      }
    });

    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update(bookData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error in PATCH /api/books/[id]:', error);
    return NextResponse.json({ message: "فشل تحديث الكتاب. يرجى المحاولة مرة أخرى." }, { status: 500 });
  }
}));

export const PUT = protect(admin(async (request, { params }) => {
  const supabase = createClient();
  const { id } = await params;
  const body = await request.json();

  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    const { title, author, category, description, pages, publishYear, language, keywords, cover_url, file_url, status } = body;

    const bookData = {
      title,
      author,
      category,
      description,
      pages: parseInt(pages),
      publishYear: parseInt(publishYear),
      language,
      keywords: keywords || [],
      cover_url,
      file_url,
      status,
    };

    // Assuming validateBookUpdate can handle all fields for PUT
    const errors = validateBookUpdate(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'فشل التحقق', errors }, { status: 400 });
    }

    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update(bookData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error in PUT /api/books/[id]:', error);
    return NextResponse.json({ message: "فشل تحديث الكتاب. يرجى المحاولة مرة أخرى." }, { status: 500 });
  }
}));

export const DELETE = protect(admin(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { id } = await params;
  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: 'Book deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/books/[id]:', error);
    return NextResponse.json({ message: "فشل حذف الكتاب" }, { status: 500 });
  }
}));