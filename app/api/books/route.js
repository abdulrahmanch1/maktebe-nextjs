import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Book from '@/models/Book';
import { protect, admin } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const ids = searchParams.get('ids');
    let query = {};

    if (ids) {
      const bookIds = ids.split(',');
      query = { _id: { $in: bookIds } };
    } else if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const books = await Book.find(query);
    return NextResponse.json(books);
  } catch (error) {
    console.error('Error in GET /api/books:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export const POST = protect(admin(async (request) => {
  await dbConnect();
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

    const errors = validateBook(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    const book = new Book(bookData);
    const newBook = await book.save();
    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}));