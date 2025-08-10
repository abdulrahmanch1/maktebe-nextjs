import { NextResponse } from 'next/server';
import { validateRegister } from '@/lib/validation';
import { sendVerificationEmail } from '@/lib/email'; // Assuming this is still needed for email verification
import { supabase } from '@/lib/supabase'; // Import supabase client

export const POST = async (request) => {
  const { username, email, password } = await request.json();

  const errors = validateRegister({ username, email, password });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }

  try {
    // Register user with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // Store username in user_metadata
          // You might want to add other default profile data here
        },
      },
    });

    if (signUpError) {
      console.error('Supabase sign-up error:', signUpError.message);
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json({ message: 'User with that email already exists' }, { status: 400 });
      }
      return NextResponse.json({ message: signUpError.message }, { status: 500 });
    }

    // If sign-up is successful, data.user will be available
    if (data.user) {
      // Supabase handles email verification flow.
      // You might still want to send a custom verification email if needed,
      // but Supabase's default email verification is usually sufficient.
      // If you need to send a custom email, you'd get the verification URL from Supabase.
      // For now, we'll assume Supabase handles the email.

      // Optionally, if you need to store additional user profile data in a separate 'profiles' table:
      // const { error: profileError } = await supabase.from('profiles').insert([
      //   { id: data.user.id, username: username, email: email, role: 'user' }
      // ]);
      // if (profileError) {
      //   console.error('Error creating user profile:', profileError.message);
      //   // Handle rollback or notify admin if profile creation fails
      // }

      return NextResponse.json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata.username, // Access username from user_metadata
          isVerified: data.user.email_confirmed_at !== null, // Check if email is confirmed
        },
      }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Invalid user data' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};