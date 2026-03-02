import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Demo Mode API Route
 * Creates a temporary test session for manual testing
 * Only works in development mode
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Demo mode only available in development' },
      { status: 403 }
    );
  }

  try {
    const { tier = 'pro' } = await request.json();

    // Validate tier
    const validTiers = ['free', 'pro', 'elite'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: free, pro, or elite' },
        { status: 400 }
      );
    }

    // Create demo user data
    const demoUser = {
      id: `demo-${tier}-${Date.now()}`,
      email: `${tier}@demo.fploptimizer`,
      name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Demo User`,
      tier: tier,
      image: null,
      optimizationsUsed: 0,
      optimizationsLimit: tier === 'free' ? 1 : null,
      isDemo: true,
    };

    // Return demo session
    return NextResponse.json({
      success: true,
      user: demoUser,
      message: `Demo mode activated: ${tier} tier`,
    });

  } catch (error) {
    console.error('Demo mode error:', error);
    return NextResponse.json(
      { error: 'Failed to activate demo mode' },
      { status: 500 }
    );
  }
}
