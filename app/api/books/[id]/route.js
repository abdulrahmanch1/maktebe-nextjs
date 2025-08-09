import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Book from '@/models/Book';
import { protect, admin } from '@/lib/middleware';
import { validateBook, validateMongoId } from '@/lib/validation';
import { parseMultipartForm } from '@/lib/cloudinaryUpload';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const { fields, coverUrl, pdfFileUrl } = await parseMultipartForm(request);

    const bookData = {
      title: fields.title ? fields.title[0] : undefined,
      author: fields.author ? fields.author[0] : undefined,
      category: fields.category ? fields.category[0] : undefined,
      description: fields.description ? fields.description[0] : undefined,
      pages: fields.pages ? parseInt(fields.pages[0]) : undefined,
      publishYear: fields.publishYear ? parseInt(fields.publishYear[0]) : undefined,
      language: fields.language ? fields.language[0] : undefined,
      keywords: fields.keywords ? fields.keywords[0].split(',').map(keyword => keyword.trim()) : undefined,
      cover: coverUrl !== undefined ? coverUrl : (fields.cover === '' ? null : undefined), // Handle clearing cover
      pdfFile: pdfFileUrl !== undefined ? pdfFileUrl : (fields.pdfFile === '' ? null : undefined), // Handle clearing pdfFile
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
