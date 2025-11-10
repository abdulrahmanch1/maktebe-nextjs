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
  const supabase = await createClient(); // Instantiate supabase client
  const { id } = await params;
  const body = await request.json();

  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    const {
      title,
      author,
      category,
      description,
      pages,
      publishYear,
      language,
      keywords,
      cover,
      pdfFile,
      favoritecount,
      readcount,
    } = body;

    const bookData = {};

    if (title !== undefined) bookData.title = title;
    if (author !== undefined) bookData.author = author;
    if (category !== undefined) bookData.category = category;
    if (description !== undefined) bookData.description = description;
    if (language !== undefined) bookData.language = language;
    if (cover !== undefined) bookData.cover = cover;
    if (pdfFile !== undefined) bookData.pdfFile = pdfFile;

    if (pages !== undefined) {
      const parsedPages = parseInt(pages, 10);
      if (Number.isNaN(parsedPages)) {
        return NextResponse.json({ message: 'عدد الصفحات يجب أن يكون رقمًا صالحًا.' }, { status: 400 });
      }
      bookData.pages = parsedPages;
    }

    if (publishYear !== undefined) {
      const parsedYear = parseInt(publishYear, 10);
      if (Number.isNaN(parsedYear)) {
        return NextResponse.json({ message: 'سنة التأليف يجب أن تكون رقمًا صالحًا.' }, { status: 400 });
      }
      bookData.publishYear = parsedYear;
    }

    if (keywords !== undefined) {
      if (Array.isArray(keywords)) {
        bookData.keywords = keywords;
      } else if (typeof keywords === 'string') {
        bookData.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
      } else {
        return NextResponse.json({ message: 'صيغة الكلمات المفتاحية غير صالحة.' }, { status: 400 });
      }
    }

    if (favoritecount !== undefined) {
      const parsedFavorite = parseInt(favoritecount, 10);
      if (Number.isNaN(parsedFavorite)) {
        return NextResponse.json({ message: 'عدد الإعجابات يجب أن يكون رقمًا صالحًا.' }, { status: 400 });
      }
      bookData.favoritecount = parsedFavorite;
    }

    if (readcount !== undefined) {
      const parsedRead = parseInt(readcount, 10);
      if (Number.isNaN(parsedRead)) {
        return NextResponse.json({ message: 'عدد القراءات يجب أن يكون رقمًا صالحًا.' }, { status: 400 });
      }
      bookData.readcount = parsedRead;
    }

    const errors = validateBookUpdate(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'فشل التحقق', errors }, { status: 400 });
    }

    if (Object.keys(bookData).length === 0) {
      return NextResponse.json({ message: 'لا توجد بيانات لتحديثها.' }, { status: 400 });
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
    console.error('Error in PATCH /api/books/[id]:', error);
    return NextResponse.json({ message: "فشل تحديث الكتاب. يرجى المحاولة مرة أخرى." }, { status: 500 });
  }
}));

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

export const PUT = protect(admin(async (request, { params }) => {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  try {
    const { title, author, category, description, pages, publishYear, language, keywords, cover, pdfFile, status, ratingTier } = body; // Added ratingTier

    const parsedPages = parseInt(pages, 10);
    const parsedPublishYear = parseInt(publishYear, 10);

    const bookData = {
      title,
      author,
      category,
      description,
      pages: isNaN(parsedPages) ? 0 : parsedPages,
      publishYear: isNaN(parsedPublishYear) ? 0 : parsedPublishYear,
      language,
      keywords: keywords || [],
      cover,
      pdfFile,
      status,
    };

    // Fetch the current book to check its status before update
    const { book: currentBook, error: currentBookError } = await getBook(id);
    if (currentBookError) {
      return NextResponse.json(currentBookError, { status: currentBookError.message === 'Cannot find book' ? 404 : 400 });
    }

    // Generate random likes and reads if status changes to 'approved'
    bookData.favoritecount = body.favoritecount !== undefined ? body.favoritecount : currentBook.favoritecount;
    bookData.readcount = body.readcount !== undefined ? body.readcount : currentBook.readcount;

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

import { createAdminClient } from '@/utils/supabase/admin';

function getFilePathFromSupabaseUrl(url, bucketName) {
  if (!url) return null;
  const parts = url.split(`/public/${bucketName}/`);
  if (parts.length > 1) {
    return parts[1].split('?')[0];
  }
  return null;
}

export const DELETE = protect(admin(async (request, { params }) => {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  const { id } = await params;
  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    // Delete cover image from storage
    if (book.cover) {
      const coverPath = getFilePathFromSupabaseUrl(book.cover, 'book-covers');
      if (coverPath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('book-covers')
          .remove([coverPath]);
        if (storageError) {
          console.error('Supabase storage delete error (cover):', storageError.message);
          // Continue with book deletion even if storage deletion fails
        }
      }
    }

    // Delete PDF file from storage
    if (book.pdfFile) {
      const pdfPath = getFilePathFromSupabaseUrl(book.pdfFile, 'book-pdfs'); // Assuming 'book-pdfs' is the bucket name for PDFs
      if (pdfPath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('book-pdfs') // Assuming 'book-pdfs' is the bucket name for PDFs
          .remove([pdfPath]);
        if (storageError) {
          console.error('Supabase storage delete error (pdf):', storageError.message);
          // Continue with book deletion even if storage deletion fails
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase database delete error:', deleteError.message);
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: 'Book and associated files deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/books/[id]:', error);
    return NextResponse.json({ message: "فشل حذف الكتاب" }, { status: 500 });
  }
}));
