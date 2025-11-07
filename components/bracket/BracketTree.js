'use client';

import { motion } from 'framer-motion';
import MatchCard from '@/components/bracket/MatchCard';

const roundVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (index) => ({ opacity: 1, x: 0, transition: { delay: index * 0.1, duration: 0.6, ease: 'easeOut' } }),
};

function RoundColumn({ title, matches, onSelect, index }) {
  return (
    <motion.div
      custom={index}
      variants={roundVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.4em] text-anl-gold">{title}</p>
      <div className="flex flex-col gap-7">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onSelect={onSelect} />
        ))}
      </div>
    </motion.div>
  );
}

export default function BracketTree({ quarter, semi, final, onMatchSelect, teamCount }) {
  const hasMatches = quarter.length + semi.length + final.length > 0;

  if (!hasMatches) {
    return (
      <div className="rounded-3xl border border-white/10 bg-anl-ink/70 p-12 text-center text-white/70">
        <p className="text-sm uppercase tracking-[0.45em] text-anl-gold">Tournament Bracket</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Awaiting 8 Teams to Register</h2>
        <p className="mt-3 text-sm text-white/60">
          {teamCount >= 8
            ? 'An administrator can seed the tournament once ready.'
            : `Currently ${teamCount} team${teamCount === 1 ? '' : 's'} registered. Seedings unlock at eight.`}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-anl-ink/70 p-8 shadow-xl">
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 1200 620"
        preserveAspectRatio="none"
      >
        <g stroke="rgba(209, 178, 18, 0.35)" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M360 80 H520 V160 H680" />
          <path d="M360 220 H520 V160" />
          <path d="M360 360 H520 V420 H680" />
          <path d="M360 500 H520 V420" />
          <path d="M840 160 H960 V290 H1080" />
          <path d="M840 420 H960 V290" />
        </g>
      </svg>
      <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr),minmax(0,1fr)]">
        <RoundColumn title="Quarterfinals" matches={quarter} onSelect={onMatchSelect} index={0} />
        <RoundColumn title="Semifinals" matches={semi} onSelect={onMatchSelect} index={1} />
        <RoundColumn title="Final" matches={final} onSelect={onMatchSelect} index={2} />
      </div>
    </div>
  );
}
