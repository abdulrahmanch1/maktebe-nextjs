import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const GET = protect(admin(async (request, context) => {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
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

export const DELETE = protect(admin(async (request, context) => {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
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
