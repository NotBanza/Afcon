'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function TeamHeader({ team, summary, performance }) {
  if (!team) {
    return null;
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-3xl border border-anl-gold/50 bg-gradient-to-br from-anl-ink via-black/80 to-black p-8 text-white shadow-xl"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-32 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            {team.flag ? (
              <Image src={team.flag} alt={`${team.name} flag`} fill sizes="(max-width: 768px) 128px, 160px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-anl-gold">
                {team.shortName}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-anl-gold">Federation</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{team.name}</h1>
            <p className="mt-2 text-sm text-white/70">Manager: {team.managerName || 'Not listed'}</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Current Rating</p>
            <p className="mt-3 text-3xl font-bold text-anl-emerald">{Math.round(team.rating)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Matches Played</p>
            <p className="mt-3 text-2xl font-semibold">{summary.matchesPlayed}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Goal Difference</p>
            <p className="mt-3 text-2xl font-semibold text-anl-gold">{summary.goalDifference}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Quarter-Finals</p>
          <p className="mt-2 text-2xl font-semibold text-white">{performance.quarterfinals}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Semi-Finals</p>
          <p className="mt-2 text-2xl font-semibold text-white">{performance.semifinals}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Finals</p>
          <p className="mt-2 text-2xl font-semibold text-white">{performance.finals}</p>
        </div>
      </div>
    </motion.section>
  );
}
