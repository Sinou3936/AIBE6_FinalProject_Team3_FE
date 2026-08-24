import { NextRequest, NextResponse } from 'next/server';
import { findSigunguNames } from '../../../lib/regionLookup';

export async function GET(request: NextRequest) {
  const sido = request.nextUrl.searchParams.get('sido');
  return NextResponse.json({ sigungu: findSigunguNames(sido) });
}
