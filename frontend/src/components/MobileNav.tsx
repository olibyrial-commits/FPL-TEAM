'use client';

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useSession } from 'next-auth/react';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

interface NavLink {
  label: string;
  href: string;
  highlight?: boolean;
}

interface MobileNavProps {
  links: NavLink[];
  variant?: 'marketing' | 'app';
  onNavClick?: (href: string) => void;
}

export function MobileNav({ links, variant = 'marketing', onNavClick }: MobileNavProps) {
  const { data: session } = useSession();
  const { isDemoMode, demoUser } = useDemoAuth();
  
  const isLoggedIn = !!session || isDemoMode;
  const isMarketing = variant === 'marketing';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-80">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-left">
            <Logo size="md" />
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-2 mt-6">
          {links.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              {link.href.startsWith('#') ? (
                <SheetClose asChild>
                  <button
                    onClick={() => {
                      onNavClick?.(link.href);
                    }}
                    className="flex items-center py-3 px-4 text-lg font-medium text-foreground hover:text-fpl-light hover:bg-accent rounded-lg transition-colors w-full text-left"
                  >
                    {link.label}
                    {link.highlight && (
                      <span className="ml-2 rounded-full bg-fpl-light px-2 py-0.5 text-[10px] font-semibold text-fpl-green">
                        NEW
                      </span>
                    )}
                  </button>
                </SheetClose>
              ) : (
                <SheetClose asChild>
                  <a
                    href={link.href}
                    className="flex items-center py-3 px-4 text-lg font-medium text-foreground hover:text-fpl-light hover:bg-accent rounded-lg transition-colors"
                  >
                    {link.label}
                    {link.highlight && (
                      <span className="ml-2 rounded-full bg-fpl-light px-2 py-0.5 text-[10px] font-semibold text-fpl-green">
                        NEW
                      </span>
                    )}
                  </a>
                </SheetClose>
              )}
            </motion.div>
          ))}
          
          {/* Bottom section - auth buttons */}
          <div className="border-t border-border mt-4 pt-4 flex flex-col gap-2">
            {isMarketing ? (
              <>
                {!isLoggedIn ? (
                  <>
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        asChild
                      >
                        <a href="/login">Login</a>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        className="w-full justify-center bg-gradient-to-r from-fpl-green to-fpl-purple hover:opacity-90 text-white"
                        asChild
                      >
                        <a href="/register">Sign Up</a>
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      asChild
                    >
                      <a href="/dashboard">Dashboard</a>
                    </Button>
                  </SheetClose>
                )}
              </>
            ) : (
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  asChild
                >
                  <a href="/settings">Settings</a>
                </Button>
              </SheetClose>
            )}
            
            {/* Demo mode tier indicator */}
            {isDemoMode && (
              <div className="px-4 py-2 bg-fpl-pink/10 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-fpl-pink">DEMO MODE</span>
                  <span>•</span>
                  <span className="uppercase">{demoUser?.tier}</span>
                </div>
              </div>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
