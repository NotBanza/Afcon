'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/bracket', label: 'Bracket' },
  { href: '/teams', label: 'Teams' },
  { href: '/goal-scorers', label: 'Goal Scorers' },
  { href: '/news', label: 'News' },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-anl-ink/80 backdrop-blur">
      <div className="container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-anl-emerald via-anl-gold to-anl-scarlet p-[2px] shadow-glow">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-anl-ink">
              <Image src="/logo.svg" alt="ANL crest" width={40} height={40} priority />
            </div>
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-anl-gold">African Nations League</p>
            <p className="-mt-0.5 text-lg font-display font-semibold text-white">2026 Championship</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/80 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-colors ${isActive ? 'text-anl-gold' : 'hover:text-anl-gold/80'}`}
              >
                {link.label}
                {isActive && <span className="absolute inset-x-0 -bottom-2 h-[2px] rounded-full bg-anl-gold" />}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-anl-gold/70 hover:text-anl-gold/90 sm:inline-flex"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-anl-emerald px-4 py-2 text-sm font-semibold text-white transition hover:bg-anl-emerald/90"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-anl-gold/70 hover:text-anl-gold/90"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-anl-gold px-4 py-2 text-sm font-semibold text-anl-ink transition hover:bg-[#ffd96e]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
