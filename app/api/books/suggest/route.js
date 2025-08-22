import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';
import { uploadFile } from '@/utils/supabase/storage';

export const POST = protect(async (request) => {
  const supabase = await createClient();
  const formData = await request.formData();

  const userId = request.user.id;
  const coverFile = formData.get('cover');
  const pdfFile = formData.get('pdfFile');

  const bookData = {
    title: formData.get('title'),
    author: formData.get('author'),
    category: formData.get('category'),
    description: formData.get('description'),
    pages: parseInt(formData.get('pages'), 10) || 0,
    publishYear: parseInt(formData.get('publishYear'), 10) || 0,
    language: formData.get('language'),
    keywords: formData.get('keywords') ? JSON.parse(formData.get('keywords')) : [],
    status: 'pending',
    user_id: userId,
    cover: null,
    pdfFile: null,
  };

  const errors = validateBook(bookData);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }

  try {
    if (coverFile && coverFile.size > 0) {
      // The uploadFile function now handles filename sanitization and uniqueness
      bookData.cover = await uploadFile(supabase, 'book-covers', coverFile);
    }

    if (pdfFile && pdfFile.size > 0) {
      // The uploadFile function now handles filename sanitization and uniqueness
      bookData.pdfFile = await uploadFile(supabase, 'book-pdfs', pdfFile);
    }
  } catch (uploadError) {
    console.error('Error during file upload:', uploadError);
    return NextResponse.json({ message: 'فشل في تحميل الملفات.' }, { status: 500 });
  }

  try {
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error (suggest):', insertError);
      // Attempt to delete uploaded files if database insert fails
      if (bookData.cover) await supabase.storage.from('book-covers').remove([bookData.cover.split('/').pop()]);
      if (bookData.pdfFile) await supabase.storage.from('book-pdfs').remove([bookData.pdfFile.split('/').pop()]);
      throw new Error(insertError.message);
    }

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books/suggest:', error);
    return NextResponse.json({ message: 'فشل في اقتراح الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
});
