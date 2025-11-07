'use client';

import Image from 'next/image';
import Link from 'next/link';

const socialLinks = [
  { href: 'https://x.com', label: 'X' },
  { href: 'https://www.instagram.com', label: 'Instagram' },
  { href: 'https://www.youtube.com', label: 'YouTube' },
];

const resourceLinks = [
  { href: '/bracket', label: 'Bracket' },
  { href: '/goal-scorers', label: 'Goal Scorers' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-anl-ink/80 backdrop-blur">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.1fr,1fr,1fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="African Nations League"
              width={40}
              height={40}
              priority
              className="h-10 w-auto"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-anl-gold">African Nations League</p>
              <p className="text-lg font-display font-semibold text-white">2026 Championship</p>
            </div>
          </div>
          <p className="max-w-md text-sm text-white/70">
            Celebrating the spirit of African football with a modern competition platform designed for supporters, analysts, and teams.
          </p>
          <p className="text-xs text-white/50">© {currentYear} African Nations League Committee. Built for INF4001N.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-anl-gold">Explore</h3>
          <ul className="space-y-2 text-sm text-white/75">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-anl-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-anl-gold">Connect</h3>
          <ul className="space-y-2 text-sm text-white/75">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-anl-gold">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
