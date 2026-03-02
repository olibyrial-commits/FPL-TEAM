'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { UserNav } from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  variant?: 'marketing' | 'app';
  className?: string;
}

interface NavLink {
  label: string;
  href: string;
  highlight?: boolean;
}

// Marketing pages: show FPL branding with anchor links
const marketingLinksLoggedOut: NavLink[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/#about' },
];

const marketingLinksLoggedIn: NavLink[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/#about' },
  { label: 'Dashboard', href: '/dashboard', highlight: true },
  { label: 'Statistics', href: '/statistics' },
  { label: 'xP', href: '/xp' },
  { label: 'Settings', href: '/settings' },
];

// App pages: show app navigation
const appLinks: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Statistics', href: '/statistics' },
  { label: 'xP', href: '/xp' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Settings', href: '/settings' },
];

export function Header({ variant = 'marketing', className }: HeaderProps) {
  const { data: session } = useSession();
  const { demoUser, isDemoMode } = useDemoAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Always use marketing nav on marketing pages regardless of auth state
  const isMarketing = variant === 'marketing';
  const isLoggedIn = !!session || isDemoMode;

  // Marketing pages should always show marketing nav
  const forceMarketing = isMarketing;

  // Choose links based on variant and auth state
  // Force marketing links on marketing pages regardless of auth
  let links: NavLink[] = [];
  if (forceMarketing || isMarketing) {
    links = isLoggedIn ? marketingLinksLoggedIn : marketingLinksLoggedOut;
  } else {
    links = appLinks;
  }

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Add glass effect after scrolling 50px
      setIsScrolled(currentScrollY > 50);

      // Hide/show based on scroll direction (only after scrolling past 100px)
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY) {
          // Scrolling down
          setIsVisible(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Smooth scroll to section (for marketing anchor links)
  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
            isScrolled
              ? 'bg-fpl-green/90 backdrop-blur-md shadow-sm border-b border-white/10'
              : 'bg-fpl-green/80 backdrop-blur-md border-b border-white/10'
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Logo size="md" />
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                {links.map((link) => (
                  <div key={link.href}>
                    {link.href.startsWith('#') && isMarketing ? (
                      <button
                        onClick={() => handleNavClick(link.href)}
                        className={cn(
                          "text-sm font-medium transition-colors text-white/70 hover:text-fpl-light"
                        )}
                      >
                        {link.label}
                        {link.highlight && (
                          <span className="ml-1 rounded-full bg-fpl-light px-2 py-0.5 text-[10px] font-semibold text-fpl-green">
                            NEW
                          </span>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className={cn(
                          "text-sm font-medium transition-colors text-white/70 hover:text-fpl-light"
                        )}
                      >
                        {link.label}
                        {link.highlight && (
                          <span className="ml-1 rounded-full bg-fpl-light px-2 py-0.5 text-[10px] font-semibold text-fpl-green">
                            NEW
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Right Section: Theme Toggle + User Nav */}
              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />
                <UserNav variant={isMarketing ? 'marketing' : 'app'} />
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <MobileNav
                  links={links}
                  variant={variant}
                  onNavClick={handleNavClick}
                />
              </div>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
