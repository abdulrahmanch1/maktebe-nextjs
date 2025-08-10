import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const protect = (handler) => {
  return async (req, ...args) => {
    // Get the Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ message: 'Not authorized, no active session' }, { status: 401 });
    }

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ message: 'Not authorized, user not found' }, { status: 401 });
    }

    // Attach Supabase user to the request object
    // Assuming user.id is the primary identifier and user_metadata.role stores the role
    req.user = {
      _id: user.id, // Map Supabase user ID to _id for consistency with old code
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user', // Default to 'user' if role not set
      username: user.user_metadata?.username, // Assuming username is in user_metadata
      // Add other user properties from Supabase user object or user_metadata as needed
    };

    return handler(req, ...args);
  };
};

export const admin = (handler) => {
  return async (req, ...args) => {
    // Ensure protect middleware has run and req.user is populated
    if (!req.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (req.user.role === 'admin') {
      return handler(req, ...args);
    } else {
      return NextResponse.json({ message: 'Not authorized as an admin' }, { status: 403 });
    }
  };
};