import { NextResponse } from 'next/server';
import { validateLogin } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // Sign in with Supabase Auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Supabase sign-in error:', signInError.message);
      // Map Supabase errors to more user-friendly messages
      if (signInError.message.includes('Email not confirmed')) {
        return NextResponse.json({ message: 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.' }, { status: 401 });
      }
      return NextResponse.json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, { status: 401 });
    }

    // If sign-in is successful, data.session and data.user will be available
    if (data.session && data.user) {
      // Supabase handles JWT token and session management.
      // The session token is automatically set in cookies by the Supabase client on the frontend.
      // For Next.js API routes, we might need to manually set the cookie if not handled by middleware.
      // However, the `protect` middleware should handle session validation.
      // We can return the user data directly.

      // Optionally, if you need to manually set a cookie for the API route context:
      // cookies().set('sb-access-token', data.session.access_token, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'Lax',
      //   maxAge: data.session.expires_in,
      //   path: '/',
      // });
      // cookies().set('sb-refresh-token', data.session.refresh_token, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'Lax',
      //   maxAge: data.session.expires_in,
      //   path: '/',
      // });

      return NextResponse.json({
        message: 'Logged in successfully',
        user: {
          id: data.user.id, // Supabase user ID
          email: data.user.email,
          // You might need to fetch additional user profile data from your 'users' table
          // if it's not directly available in data.user (e.g., username, role, favorites, readingList)
          // For now, we'll return basic user info from Supabase Auth
        },
      });
    } else {
      return NextResponse.json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, { status: 401 });
    }
  } catch (err) {
    console.error("Error during login:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}