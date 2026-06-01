// API route: /api/settings
// Handles GET (fetch settings) and PUT (update settings)

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── GET /api/settings ───
// Fetch global site settings (creates default if none exist)
export async function GET() {
  try {
    // Get the first (and only) settings record
    let settings = await db.siteSetting.findFirst();

    // If no settings exist, create default ones
    if (!settings) {
      settings = await db.siteSetting.create({
        data: {
          shopName: 'AutoElite Motors',
          phone: '+255 757 337 929',
          email: 'info@autoelite.co.tz',
          address: '123 Safari Drive, Dar es Salaam, Tanzania',
          location: '-6.7924,39.2083',
          hours: 'Mon-Fri: 8AM-6PM | Sat: 9AM-4PM | Sun: Closed',
          whatsapp: '255757337929',
          logo: '/images/logo.png',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// ─── PUT /api/settings ───
// Update global site settings (requires authentication)
export async function PUT(request: NextRequest) {
  try {
    // Auth check: only authenticated admins can update settings
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get existing settings
    let settings = await db.siteSetting.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await db.siteSetting.create({
        data: {
          shopName: body.shopName || 'AutoElite Motors',
          logo: body.logo || '',
          phone: body.phone || '',
          email: body.email || '',
          address: body.address || '',
          location: body.location || '',
          hours: body.hours || '',
          whatsapp: body.whatsapp || '',
        },
      });
    } else {
      // Update existing settings
      const updateData: Record<string, unknown> = {};
      if (body.shopName !== undefined) updateData.shopName = body.shopName;
      if (body.logo !== undefined) updateData.logo = body.logo;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.hours !== undefined) updateData.hours = body.hours;
      if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;

      settings = await db.siteSetting.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
