// API route: /api/cars/[id]
// Handles GET (single car), PUT (update car), DELETE (remove car)

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── GET /api/cars/[id] ───
// Fetch a single car by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const car = await db.car.findUnique({ where: { id } });

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    return NextResponse.json({
      car: { ...car, images: (() => { try { return JSON.parse(car.images); } catch { return []; } })() },
    });
  } catch (error) {
    console.error('Error fetching car:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car' },
      { status: 500 }
    );
  }
}

// ─── PUT /api/cars/[id] ───
// Update an existing car listing (requires admin authentication)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: only authenticated admins can update cars
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if car exists
    const existing = await db.car.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // Validate numeric fields if provided — prevent NaN from being stored
    const numericChecks: [string, unknown][] = [];
    if (body.year !== undefined) numericChecks.push(['year', body.year]);
    if (body.price !== undefined) numericChecks.push(['price', body.price]);
    if (body.mileage !== undefined) numericChecks.push(['mileage', body.mileage]);
    if (body.seats !== undefined) numericChecks.push(['seats', body.seats]);
    if (body.doors !== undefined) numericChecks.push(['doors', body.doors]);
    for (const [field, value] of numericChecks) {
      if (isNaN(parseInt(String(value)))) {
        return NextResponse.json(
          { error: `Invalid numeric value for field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.year !== undefined) updateData.year = parseInt(String(body.year));
    if (body.price !== undefined) updateData.price = parseInt(String(body.price));
    if (body.mileage !== undefined) updateData.mileage = parseInt(String(body.mileage));
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType;
    if (body.bodyType !== undefined) updateData.bodyType = body.bodyType;
    if (body.seats !== undefined) updateData.seats = parseInt(String(body.seats));
    if (body.doors !== undefined) updateData.doors = parseInt(String(body.doors));
    if (body.color !== undefined) updateData.color = body.color;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);
    if (body.featured !== undefined) updateData.featured = body.featured;

    const car = await db.car.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      car: { ...car, images: (() => { try { return JSON.parse(car.images); } catch { return []; } })() },
    });
  } catch (error) {
    console.error('Error updating car:', error);
    return NextResponse.json(
      { error: 'Failed to update car' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/cars/[id] ───
// Remove a car listing (requires admin authentication)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: only authenticated admins can delete cars
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if car exists
    const existing = await db.car.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    await db.car.delete({ where: { id } });

    return NextResponse.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 }
    );
  }
}
