'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface NavbarClientProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
}

export function NavbarClient({ children, isLoggedIn }: NavbarClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-zinc-950/95 backdrop-blur-md border-b border-white/8'
          : 'bg-transparent'
      }`}
    >
      {children}

      {mobileOpen && (
        <nav className="md:hidden border-t border-white/8 bg-zinc-950/95 backdrop-blur-md px-4 py-4 flex flex-col gap-1">
          <a href="#features" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Features</a>
          <a href="#pricing"  onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Pricing</a>
          <div className="border-t border-white/8 mt-2 pt-2">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-md text-sm text-primary-foreground bg-primary hover:bg-primary/90 text-center transition-colors">
                Go to Dashboard →
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/sign-in"   onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Sign In</Link>
                <Link href="/register"  onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-sm text-primary-foreground bg-primary hover:bg-primary/90 text-center transition-colors">Get Started</Link>
              </div>
            )}
          </div>
        </nav>
      )}

      <button
        type="button"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden absolute top-0 right-4 h-16 flex items-center justify-center w-10 text-zinc-400 hover:text-white transition-colors"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </header>
  );
}
