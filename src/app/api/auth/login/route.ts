// API route: /api/auth/login
// Handles POST - admin login authentication

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── POST /api/auth/login ───
// Authenticate admin user and set session cookie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find admin user by username
    const admin = await db.admin.findUnique({
      where: { username: body.username },
    });

    // Simple password comparison (in production, use bcrypt/argon2)
    if (!admin || admin.password !== body.password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set a simple session cookie (in production, use JWT or NextAuth)
    const cookieStore = await cookies();
    cookieStore.set('admin_session', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      message: 'Login successful',
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
