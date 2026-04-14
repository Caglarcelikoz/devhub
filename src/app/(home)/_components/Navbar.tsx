import Link from 'next/link';
import { auth } from '@/auth';
import { NavbarClient } from './NavbarClient';

export async function Navbar() {
  const session = await auth();
  const isLoggedIn = !!session;

  return (
    <NavbarClient isLoggedIn={isLoggedIn}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="#3b82f6" />
            <path d="M7 7h5v14H7V7zm7 0h7v5h-7V7zm0 9h7v5h-7v-5z" fill="white" />
          </svg>
          <span className="text-base tracking-tight">devhub</span>
        </Link>

        {/* Nav links — desktop only */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
          <a href="#features" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm">Pricing</a>
        </nav>

        {/* CTA — desktop only; mobile uses hamburger menu */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-zinc-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Spacer so hamburger button (rendered in NavbarClient) doesn't overlap logo on mobile */}
        <div className="md:hidden w-10" aria-hidden="true" />
      </div>
    </NavbarClient>
  );
}
