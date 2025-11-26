import { NextResponse } from 'next/server';
import { protect, getUserFromRequest } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';


const buildInitialProgress = () => ({
  page: 1,
  percentage: 0,
  updatedAt: new Date().toISOString(),
});

const sanitizeProgressPayload = (input) => {
  if (!input || typeof input !== 'object') return null;
  const rawPage = Number(input.page);
  if (!Number.isFinite(rawPage) || rawPage < 1) {
    return null;
  }

  let normalizedPercentage = null;
  if (typeof input.percentage !== 'undefined' && input.percentage !== null) {
    const rawPercentage = Number(input.percentage);
    if (!Number.isFinite(rawPercentage)) {
      return null;
    }
    normalizedPercentage = Math.min(100, Math.max(0, parseFloat(rawPercentage.toFixed(1))));
  }

  return {
    page: Math.max(1, Math.floor(rawPage)),
    percentage: normalizedPercentage,
    updatedAt: new Date().toISOString(),
  };
};

export const DELETE = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id, bookId } = await params;

  if (!id || !bookId) {
    return NextResponse.json({ message: 'User ID and Book ID are required' }, { status: 400 });
  }

  const user = getUserFromRequest(request);
  if (id !== user.id) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  try {
    // Fetch the user's current reading list
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('readinglist')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentReadingList = Array.isArray(user.readinglist) ? user.readinglist : [];

    // Filter out the bookId from the reading list
    const updatedReadingList = currentReadingList.filter(item => item.book !== bookId);

    // Update the user's reading list
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ readinglist: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement readcount in the books table atomically
    const { error: decrementError } = await supabase.rpc('decrement_readcount', { book_id: bookId });

    if (decrementError) {
      console.error('Error decrementing readcount:', decrementError.message);
      return NextResponse.json({ message: 'تمت إزالة الكتاب من القائمة، لكن فشل تحديث العداد الإجمالي' }, { status: 500 });
    }

    // Fetch the updated readcount for the book
    const { data: updatedBook, error: fetchBookError } = await supabase
      .from('books')
      .select('title, readcount')
      .eq('id', bookId)
      .single();

    // Revalidate the book details page if we have the title
    if (updatedBook?.title) {
      revalidatePath(`/book/${bookId}`, 'page');
    }

    if (fetchBookError) {
      console.error('Error fetching updated readcount for book:', fetchBookError.message);
    }

    return NextResponse.json({
      readingList: updatedReadingList,
      readCount: updatedBook ? updatedBook.readcount : undefined
    });

  } catch (err) {
    console.error("Error removing from reading list:", err);
    return NextResponse.json({ message: "خطأ في إزالة الكتاب من قائمة القراءة" }, { status: 500 });
  }
});

export const PATCH = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id: userId, bookId } = await params; // User ID from URL, Book ID from URL
  const body = await request.json();
  const { read, progress } = body || {};

  const hasReadUpdate = typeof read === 'boolean';
  const progressPayload = progress ? sanitizeProgressPayload(progress) : null;

  if (!hasReadUpdate && !progressPayload) {
    return NextResponse.json({ message: 'لم يتم إرسال حقول صالحة للتحديث.' }, { status: 400 });
  }

  if (progress && !progressPayload) {
    return NextResponse.json({ message: 'بيانات التقدم غير صالحة.' }, { status: 400 });
  }

  // Verify user is authorized to update this reading list entry
  // The protect middleware ensures user is logged in.
  // Now check if the user ID in the URL matches the authenticated user's ID.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.id !== userId) {
    return NextResponse.json({ message: 'Unauthorized to update this reading list.' }, { status: 403 });
  }

  try {
    // Fetch the user's current reading list
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('readinglist')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    const currentReadingList = Array.isArray(userProfile.readinglist) ? userProfile.readinglist : [];

    let entryFound = false;
    const updatedReadingList = currentReadingList.map(item => {
      if (item.book !== bookId) {
        return item;
      }

      entryFound = true;
      const updatedItem = { ...item };
      if (hasReadUpdate) {
        updatedItem.read = read;
      }
      if (progressPayload) {
        updatedItem.progress = progressPayload;
      } else if (!updatedItem.progress) {
        updatedItem.progress = buildInitialProgress();
      }
      return updatedItem;
    });

    if (!entryFound) {
      return NextResponse.json({ message: 'الكتاب غير موجود في قائمة القراءة.' }, { status: 404 });
    }

    // Update the user's reading list in the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ readinglist: updatedReadingList })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase update reading list error:', updateError);
      throw new Error(updateError.message);
    }

    revalidatePath(`/book/${bookId}`, 'page'); // Revalidate the book details page

    return NextResponse.json({ message: 'تم تحديث حالة القراءة بنجاح.' });
  } catch (error) {
    console.error('Error updating reading list status:', error);
    return NextResponse.json({ message: 'Failed to update reading status.' }, { status: 500 });
  }
});
