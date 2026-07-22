import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../services/auth';

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', error);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await getCurrentUser(request.headers.get('cookie') ?? undefined);
    return NextResponse.redirect(new URL('/home', request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
  }
}
