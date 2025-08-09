import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Book from '@/models/Book';
import { protect, admin } from '@/lib/middleware';
import { validateBook, validateMongoId } from '@/lib/validation';

async function getBook(id) {
  await dbConnect();
  const errors = validateMongoId(id);
  if (Object.keys(errors).length > 0) {
    return { book: null, error: { message: 'Invalid Book ID', errors } };
  }
  const book = await Book.findById(id).populate('comments.user', 'username profilePicture');
  if (!book) {
    return { book: null, error: { message: 'Cannot find book' } };
  }
  return { book, error: null };
}

export async function GET(request, { params }) {
  const { id } = params;
  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }
  return NextResponse.json(book);
}

export const PATCH = protect(admin(async (request, { params }) => {
  const { id } = params;
  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    const { title, author, category, description, pages, publishYear, language, keywords, cover, pdfFile } = await request.json();

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
    };

    // Filter out undefined values to only update provided fields
    Object.keys(bookData).forEach(key => {
      if (bookData[key] === undefined) {
        delete bookData[key];
      }
    });

    const errors = validateBook(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    Object.assign(book, bookData);

    const updatedBook = await book.save();
    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error in PATCH /api/books/[id]:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}));

export const DELETE = protect(admin(async (request, { params }) => {
  const { id } = params;
  const { book, error } = await getBook(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Cannot find book' ? 404 : 400 });
  }

  try {
    await book.deleteOne();
    return NextResponse.json({ message: 'Book deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/books/[id]:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}));
