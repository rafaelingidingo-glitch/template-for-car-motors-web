// API route: /api/cars
// Handles GET (list with filters) and POST (create new car)

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── GET /api/cars ───
// Fetch cars with optional filters (query params)
// Supports: brand, year, fuelType, condition, bodyType, minPrice, maxPrice, minMileage, maxMileage, status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build filter conditions from query parameters
    const where: Record<string, unknown> = {};

    // Brand filter (exact match, case-sensitive — SQLite default)
    const brand = searchParams.get('brand');
    if (brand && brand !== 'all') {
      where.brand = brand;
    }

    // Year filter
    const year = searchParams.get('year');
    if (year && year !== 'all') {
      where.year = parseInt(year);
    }

    // Fuel type filter
    const fuelType = searchParams.get('fuelType');
    if (fuelType && fuelType !== 'all') {
      where.fuelType = fuelType;
    }

    // Condition filter (New, Used, Refurbished)
    const condition = searchParams.get('condition');
    if (condition && condition !== 'all') {
      where.condition = condition;
    }

    // Body type filter
    const bodyType = searchParams.get('bodyType');
    if (bodyType && bodyType !== 'all') {
      where.bodyType = bodyType;
    }

    // Status filter (Available, Sold)
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      where.status = status;
    }

    // Price range filter (parseInt to match Int schema type)
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = parseInt(minPrice);
    if (maxPrice) priceFilter.lte = parseInt(maxPrice);
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    // Mileage range filter
    const minMileage = searchParams.get('minMileage');
    const maxMileage = searchParams.get('maxMileage');
    const mileageFilter: Record<string, number> = {};
    if (minMileage) mileageFilter.gte = parseInt(minMileage);
    if (maxMileage) mileageFilter.lte = parseInt(maxMileage);
    if (Object.keys(mileageFilter).length > 0) {
      where.mileage = mileageFilter;
    }

    // Fetch cars with applied filters
    const cars = await db.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse images JSON string to array for each car (with safe fallback)
    const carsWithParsedImages = cars.map((car) => ({
      ...car,
      images: (() => { try { return JSON.parse(car.images); } catch { return []; } })(),
    }));

    return NextResponse.json({ cars: carsWithParsedImages });
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 }
    );
  }
}

// ─── POST /api/cars ───
// Create a new car listing (requires admin authentication)
export async function POST(request: NextRequest) {
  try {
    // Auth check: only authenticated admins can create cars
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['brand', 'model', 'year', 'price', 'mileage', 'condition', 'fuelType', 'bodyType', 'seats', 'doors', 'color'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields — parseInt returns NaN for invalid inputs
    const numericFields = { year: body.year, price: body.price, mileage: body.mileage, seats: body.seats, doors: body.doors };
    for (const [field, value] of Object.entries(numericFields)) {
      if (isNaN(parseInt(String(value)))) {
        return NextResponse.json(
          { error: `Invalid numeric value for field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the car with provided data
    const car = await db.car.create({
      data: {
        brand: body.brand,
        model: body.model,
        year: parseInt(String(body.year)),
        price: parseInt(String(body.price)),
        mileage: parseInt(String(body.mileage)),
        condition: body.condition,
        fuelType: body.fuelType,
        bodyType: body.bodyType,
        seats: parseInt(String(body.seats)),
        doors: parseInt(String(body.doors)),
        color: body.color,
        status: body.status || 'Available',
        description: body.description || null,
        images: JSON.stringify(body.images || []),
        featured: body.featured || false,
      },
    });

    return NextResponse.json({
      car: { ...car, images: (() => { try { return JSON.parse(car.images); } catch { return []; } })() },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json(
      { error: 'Failed to create car' },
      { status: 500 }
    );
  }
}
