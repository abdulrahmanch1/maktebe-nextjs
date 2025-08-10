import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const GET = protect(admin(async (request) => {
  try {
    // Fetch all users from the 'users' table
    // Assuming 'password' column is not selected by default or handled by Row Level Security (RLS)
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*'); // Select all columns, rely on RLS for sensitive data like password

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return NextResponse.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}));