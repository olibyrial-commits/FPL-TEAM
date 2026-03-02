'use client';

import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { LogOut, Crown, Sparkles, Zap } from 'lucide-react';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { StaggerContainer, StaggerItem, GradientText } from '@/components/animations';
import Image from 'next/image';

const TIER_INFO = {
  free: {
    name: 'Free',
    icon: Zap,
    color: 'bg-muted text-muted-foreground',
    optimizations: '1/month',
    horizon: '3 weeks',
    features: ['1 optimization per month', '3-week horizon predictions', 'Basic transfer suggestions', 'Email support'],
  },
  pro: {
    name: 'Pro',
    icon: Sparkles,
    color: 'bg-purple-500/10 text-purple-500',
    optimizations: 'Unlimited',
    horizon: '4 weeks',
    features: ['Unlimited optimizations', '4-week horizon predictions', 'Chip recommendations', 'Priority support', 'Export to CSV'],
  },
  elite: {
    name: 'Elite',
    icon: Crown,
    color: 'bg-amber-500/10 text-amber-500',
    optimizations: 'Unlimited',
    horizon: '8 weeks',
    features: ['Everything in Pro', '8-week horizon predictions', 'Advanced analytics', 'VIP support', 'API access'],
  },
} as const;

type Tier = 'free' | 'pro' | 'elite';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { demoUser, setDemoTier, isDemo } = useDemoAuth();

  const currentTier = (demoUser?.tier || 'free') as Tier;
  const tierData = TIER_INFO[currentTier];
  const TierIcon = tierData.icon;

  const isDark = theme === 'dark';

  const handleSignOut = () => {
    if (isDemo) {
      window.location.href = '/';
    } else {
      signOut({ callbackUrl: '/' });
    }
  };

  return (
    <StaggerContainer staggerDelay={0.1} className="space-y-8 pb-10">
      <StaggerItem direction="up">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight"><GradientText>Settings</GradientText></h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account and application preferences
        </p>
      </StaggerItem>

      <div className="grid gap-6 max-w-2xl">
        <StaggerItem direction="up">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 min-h-[180px] flex items-center p-6 sm:p-8">
            <Image 
              src="/images/settings_fpl.png" 
              alt="Premium FPL Settings" 
              fill 
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover opacity-40 select-none mix-blend-screen" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
            <div className="relative z-10 max-w-sm">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-3">
                <Crown className="h-6 w-6 text-amber-400" /> Premium Access
              </h3>
              <p className="text-white/80 text-base leading-relaxed">
                Unlock elite optimizations, advanced analytics, and custom multi-week horizons.
              </p>
            </div>
          </div>
        </StaggerItem>

        {/* Appearance */}
        <StaggerItem direction="up">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <Separator />

        {/* Subscription */}
        <StaggerItem direction="up">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Your current plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {tierData.optimizations} • {tierData.horizon} horizon
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tierData.color}`}>
                  <TierIcon className="mr-1 h-3 w-3" />
                  {tierData.name}
                </span>
              </div>

              {isDemo && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-3">Demo Mode - Switch Tier:</p>
                  <div className="flex gap-2">
                    {(['free', 'pro', 'elite'] as Tier[]).map((tier) => (
                      <Button
                        key={tier}
                        variant={currentTier === tier ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDemoTier(tier)}
                      >
                        {TIER_INFO[tier].name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Plan Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {tierData.features.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Optimizations Used This Month</p>
                  <p className="text-sm text-muted-foreground">
                    0 / {tierData.optimizations === 'Unlimited' ? '∞' : '1'} optimizations
                  </p>
                </div>
                {currentTier === 'free' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href="/pricing">Upgrade Plan</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <Separator />

        {/* Account Info */}
        <StaggerItem direction="up">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email || 'Not logged in'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Display Name</Label>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.name || 'Not set'}
                </p>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>FPL Team ID</Label>
                <p className="text-sm text-muted-foreground">Not connected</p>
                <p className="text-xs text-muted-foreground">
                  Connect your FPL team to get personalized recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <Separator />

        {/* Sign Out */}
        <StaggerItem direction="up">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-xl border-destructive/20">
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
              <CardDescription>
                Sign out of your account on this device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isDemo ? 'Exit Demo' : 'Sign Out'}
              </Button>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
