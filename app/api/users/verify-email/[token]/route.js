import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const GET = async (request, { params }) => {
  const { token } = params; // This 'token' is likely the OTP or a custom token

  try {
    // Supabase handles email verification internally.
    // If you are using Supabase's built-in email verification,
    // the user clicking the link in their email will automatically update their status.
    // This API route might be for a custom verification flow.

    // If 'token' is an OTP for email verification (e.g., from a magic link or custom email):
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token, // Assuming 'token' is the token_hash from the email link
      type: 'email', // Or 'signup' depending on your flow
    });

    if (verifyError) {
      console.error('Supabase email verification error:', verifyError.message);
      return NextResponse.json({ message: 'Invalid or expired verification token' }, { status: 400 });
    }

    // If verification is successful, the user's email_confirmed_at will be updated by Supabase.
    // You might want to fetch the user to confirm or redirect them.
    // For now, just return success.
    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};