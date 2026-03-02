'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Chrome, Loader2, Mail, Zap, Crown, Trophy, User, TestTube } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl });
  };

  /**
   * Demo Mode - Quick login for testing
   * Creates a temporary demo session without needing real credentials
   */
  const handleDemoLogin = async (tier: 'free' | 'pro' | 'elite') => {
    setIsLoading(true);
    setError('');

    try {
      // Create demo user data directly without NextAuth
      const demoEmail = `demo-${tier}@fploptimizer.test`;
      const demoUser = {
        id: `demo-${tier}-${Date.now()}`,
        email: demoEmail,
        name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Demo User`,
        image: null,
        tier: tier,
        optimizationsUsed: 0,
        optimizationsLimit: tier === 'free' ? 1 : null,
        isDemo: true,
      };
      
      // Store demo session in localStorage
      localStorage.setItem('demo-session', JSON.stringify(demoUser));
      
      // Set cookie for middleware to recognize demo session
      document.cookie = `demo-session=${demoUser.id}; path=/; max-age=86400`;
      
      // Redirect to dashboard immediately (bypass NextAuth)
      router.push(callbackUrl);
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Demo mode failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue to FPL Optimizer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-fpl-green to-fpl-purple hover:opacity-90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in with Email'
              )}
            </Button>
          </form>

          {/* Demo Mode Section - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground flex items-center gap-1">
                    <TestTube className="h-3 w-3" />
                    Demo Mode (Testing)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Quick test accounts with pre-loaded data
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('free')}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-xs">Free</span>
                    <Badge variant="secondary" className="text-[10px]">1 opt</Badge>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('pro')}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 h-auto py-2 border-fpl-light/50"
                  >
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs">Pro</span>
                    <Badge variant="default" className="text-[10px] bg-fpl-light text-fpl-green">Unlimited</Badge>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('elite')}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 h-auto py-2 border-fpl-pink/50"
                  >
                    <Crown className="h-4 w-4 text-fpl-pink" />
                    <span className="text-xs">Elite</span>
                    <Badge variant="default" className="text-[10px] bg-fpl-pink">8 weeks</Badge>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>

          {/* Testing Info Box */}
          <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
            <p className="font-medium text-muted-foreground">Testing Instructions:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Use <strong>Demo Mode</strong> buttons above for instant access</li>
              <li>Free tier: Limited to 1 optimization per month</li>
              <li>Pro/Elite: Unlimited optimizations with all features</li>
              <li>Test team URL: <code className="bg-background px-1 rounded">https://fantasy.premierleague.com/entry/7505923/event/28</code></li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
