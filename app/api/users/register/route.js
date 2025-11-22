import { NextResponse } from 'next/server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

const userSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(request) {
    const supabase = await createClient();
    try {
        const body = await request.json();
        const { username, email, password } = userSchema.parse(body);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                },
            },
        });

        if (error) {
            return NextResponse.json({ message: 'Could not create user.', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            message: `مرحباً بك في مكتبة دار القراء، ${username}! 📚✨ يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.`,
            user: data.user
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.errors }, { status: 400 });
        }
        console.error('Register API Error:', error);
        return NextResponse.json({ message: 'An unexpected error occurred. Please try again.' }, { status: 500 });
    }
}
