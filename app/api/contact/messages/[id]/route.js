import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { supabase } from '@/lib/supabase'; // Import supabase client

export const GET = protect(admin(async (request, { params }) => {
  const { id } = params;

  // const errors = validateMongoId(id); // Removed validateMongoId call
  // if (Object.keys(errors).length > 0) { // Removed this block
  //   return NextResponse.json({ message: 'Invalid Message ID', errors }, { status: 400 });
  // }
  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
  }

  try {
    const { data: message, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }
    return NextResponse.json(message);
  } catch (err) {
    console.error("Error fetching contact message:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}));

export const DELETE = protect(admin(async (request, { params }) => {
  const { id } = params;

  // const errors = validateMongoId(id); // Removed validateMongoId call
  // if (Object.keys(errors).length > 0) { // Removed this block
  //   return NextResponse.json({ message: 'Invalid Message ID', errors }, { status: 400 });
  // }
  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
    return NextResponse.json({ message: 'Message deleted' });
  } catch (err) {
    console.error("Error deleting contact message:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}));