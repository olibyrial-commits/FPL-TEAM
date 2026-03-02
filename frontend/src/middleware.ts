import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const isDemo = req.cookies.get('demo-session') !== undefined;
        
        // Allow access if user has a token OR if it's a demo session
        return !!token || isDemo;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/api/protected/:path*',
  ],
};
