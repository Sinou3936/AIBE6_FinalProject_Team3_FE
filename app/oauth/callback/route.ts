import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../services/auth';

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  try {
    await getCurrentUser(request.headers.get('cookie') ?? undefined);
    return NextResponse.redirect(new URL('/home', request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
  }
}
