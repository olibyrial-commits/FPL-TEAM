import { useSession, signOut } from 'next-auth/react';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, TestTube } from 'lucide-react';
import Link from 'next/link';

interface UserNavProps {
  variant?: 'marketing' | 'app';
}

export function UserNav({ variant = 'marketing' }: UserNavProps) {
  const { data: session, status } = useSession();
  const { demoUser, isDemoMode, logoutDemo } = useDemoAuth();
  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  // No user logged in (real or demo)
  if (!session?.user && !demoUser) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/login">Login</Link>
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-fpl-green to-fpl-purple hover:opacity-90 text-white"
          asChild
        >
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    );
  }

  // Use demo user data if in demo mode
  const user = isDemoMode ? demoUser : session?.user;
  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  const handleLogout = () => {
    if (isDemoMode) {
      logoutDemo();
    } else {
      signOut({ callbackUrl: '/' });
    }
  };

  if (variant === 'app') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
              <AvatarFallback className={`text-white text-sm ${isDemoMode ? 'bg-fpl-pink' : 'bg-fpl-green'}`}>
                {isDemoMode ? <TestTube className="h-4 w-4" /> : initials}
              </AvatarFallback>
            </Avatar>
            {isDemoMode && (
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-fpl-pink border-2 border-background" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'User'}
                </p>
                {isDemoMode && (
                  <Badge variant="outline" className="text-[10px] h-4 border-fpl-pink text-fpl-pink">
                    DEMO
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              {isDemoMode && (
                <p className="text-xs text-fpl-pink">
                  Tier: {(user as any)?.tier?.toUpperCase()}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isDemoMode ? 'Exit Demo' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
            <AvatarFallback className={`text-white text-sm ${isDemoMode ? 'bg-fpl-pink' : 'bg-fpl-green'}`}>
              {isDemoMode ? <TestTube className="h-4 w-4" /> : initials}
            </AvatarFallback>
          </Avatar>
          {isDemoMode && (
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-fpl-pink border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {user?.name || 'User'}
              </p>
              {isDemoMode && (
                <Badge variant="outline" className="text-[10px] h-4 border-fpl-pink text-fpl-pink">
                  DEMO
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {isDemoMode && (
              <p className="text-xs text-fpl-pink">
                Tier: {(user as any)?.tier?.toUpperCase()}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isDemoMode ? 'Exit Demo' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
