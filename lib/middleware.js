import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = (handler) => {
  return async (req, ...args) => {
    await dbConnect();
    let token;

    // 1. Try to get token from HttpOnly cookie
    const cookieStore = cookies();
    token = cookieStore.get('token')?.value;

    // 2. If not in cookie, try to get from Authorization header (for backward compatibility or specific client needs)
    if (!token && req.headers.get('authorization') && req.headers.get('authorization').startsWith('Bearer')) {
      token = req.headers.get('authorization').split(' ')[1];
    }

    if (!token) {
      return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return NextResponse.json({ message: 'Not authorized, user not found' }, { status: 401 });
      }
      return handler(req, ...args);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: 'Not authorized, token failed' }, { status: 401 });
    }
  };
};

export const admin = (handler) => {
  return async (req, ...args) => {
    if (req.user && req.user.role === 'admin') {
      return handler(req, ...args);
    } else {
      return NextResponse.json({ message: 'Not authorized as an admin' }, { status: 403 });
    }
  };
};
