import { NextRequest, NextResponse } from 'next/server';
import { findEupmyeondongNames } from '../../../lib/regionLookup';

export async function GET(request: NextRequest) {
  const sido = request.nextUrl.searchParams.get('sido');
  const sigungu = request.nextUrl.searchParams.get('sigungu');
  return NextResponse.json({ eupmyeondong: findEupmyeondongNames(sido, sigungu) });
}
