import Link from 'next/link';

const productLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing',  href: '#pricing'  },
  { label: 'Changelog', href: '#'        },
  { label: 'Roadmap',  href: '#'         },
];

const accountLinks = [
  { label: 'Sign In',    href: '/sign-in'    },
  { label: 'Register',   href: '/register'   },
  { label: 'Dashboard',  href: '/dashboard'  },
  { label: 'Profile',    href: '/profile'    },
];

const legalLinks = [
  { label: 'Privacy Policy',   href: '#' },
  { label: 'Terms of Service', href: '#' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white w-fit">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect width="28" height="28" rx="8" fill="#3b82f6" />
                <path d="M7 7h5v14H7V7zm7 0h7v5h-7V7zm0 9h7v5h-7v-5z" fill="white" />
              </svg>
              <span>devhub</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              A knowledge hub for code snippets, AI prompts, commands, notes, files, images, and links.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="flex flex-col gap-2.5">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <ul className="flex flex-col gap-2.5">
              {accountLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="flex flex-col gap-2.5">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-zinc-800 text-sm text-zinc-600">
          © {year} Devhub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
