import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const protect = (handler) => {
  return async (req, ...args) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token is missing' }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ message: 'Not authorized or token is invalid' }, { status: 401 });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user',
      username: user.user_metadata?.username,
    };

    return handler(req, ...args);
  };
};

export const admin = (handler) => {
  return async (req, ...args) => {
    // This middleware should be used after the 'protect' middleware.
    if (!req.user) {
      return NextResponse.json({ message: 'Authentication required. Please log in.' }, { status: 401 });
    }

    if (req.user.role === 'admin') {
      return handler(req, ...args);
    } else {
      return NextResponse.json({ message: 'غير مصرح به كمسؤول' }, { status: 403 });
    }
  };
};
