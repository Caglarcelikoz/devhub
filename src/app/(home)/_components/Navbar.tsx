import Link from 'next/link';
import { auth } from '@/auth';
import { NavbarClient } from './NavbarClient';

export async function Navbar() {
  const session = await auth();

  return (
    <NavbarClient>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="#3b82f6" />
            <path d="M7 7h5v14H7V7zm7 0h7v5h-7V7zm0 9h7v5h-7v-5z" fill="white" />
          </svg>
          <span className="text-base tracking-tight">devhub</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </NavbarClient>
  );
}
