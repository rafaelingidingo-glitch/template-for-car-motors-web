// API route: /api/admin
// Handles GET - list all admin users, POST - create new admin user

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── GET /api/admin ───
// List all admin users (requires auth)
export async function GET() {
  try {
    // Check auth
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admins = await db.admin.findMany({
      select: { id: true, username: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

// ─── POST /api/admin ───
// Create a new admin user
export async function POST(request: NextRequest) {
  try {
    // Check auth
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await db.admin.findUnique({
      where: { username: body.username },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const admin = await db.admin.create({
      data: {
        username: body.username,
        password: body.password, // In production, hash with bcrypt
      },
    });

    return NextResponse.json({
      admin: { id: admin.id, username: admin.username },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
