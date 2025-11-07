'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const buttons = [
  {
    href: '/bracket',
    label: 'View Tournament',
    variant: 'primary',
  },
  {
    href: '/register',
    label: 'Register Federation',
    variant: 'ghost',
  },
  {
    href: '/admin',
    label: 'Admin Login',
    variant: 'ghost',
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[url('/hero-stadium.svg')] bg-cover bg-center bg-no-repeat shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-anl-ink/75 to-black/60" />
      <motion.div
        className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center sm:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.span
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-anl-gold"
        >
          Road to Glory
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.75 }}
          className="font-display text-4xl font-extrabold text-anl-gold drop-shadow-lg sm:text-5xl md:text-6xl"
        >
          African Nations League
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.75 }}
          className="mt-5 max-w-2xl text-base text-white/80 sm:text-lg"
        >
          Road to Glory. Register. Compete. Rise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="mt-10 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"
        >
          {buttons.map((button) => (
            <Link
              key={button.href}
              href={button.href}
              className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold transition sm:w-auto sm:text-base ${
                button.variant === 'primary'
                  ? 'anl-gradient text-anl-ink shadow-glow hover:scale-[1.03]'
                  : 'border border-white/20 bg-white/10 text-white/80 hover:border-anl-gold/80 hover:text-anl-gold'
              }`}
            >
              {button.label}
            </Link>
          ))}
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-24 translate-y-1/2 rounded-full bg-gradient-to-t from-anl-ink/70 to-transparent blur-3xl" />
    </section>
  );
}
