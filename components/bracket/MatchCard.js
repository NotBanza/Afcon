'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const STATUS_COPY = {
  waiting: 'Awaiting opponent',
  pending: 'Scheduled',
  completed: 'Full time',
  seeding: 'Seeded pairing',
};

const SCORE_PLACEHOLDER = '–';

function resolveScore(value) {
  return typeof value === 'number' ? value : SCORE_PLACEHOLDER;
}

function teamRowClasses(isWinner, isPlaceholder) {
  const classes = ['flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition'];
  classes.push(isWinner ? 'border border-anl-gold bg-anl-ink/80 shadow-glow' : 'border border-white/10 bg-black/30');
  if (isPlaceholder) {
    classes.push('text-white/50');
  } else {
    classes.push('text-white');
  }
  return classes.join(' ');
}

function TeamBadge({ team }) {
  if (!team.flag) {
    return (
      <div className="flex h-7 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-[0.65rem] font-semibold text-white/60">
        {team.shortName}
      </div>
    );
  }

  return (
    <div className="relative h-7 w-10 overflow-hidden rounded-lg border border-white/10">
      <Image src={team.flag} alt={`${team.name} flag`} fill sizes="40px" className="object-cover" />
    </div>
  );
}

export default function MatchCard({ match, onSelect }) {
  const { team1, team2, winnerId, status, score, round } = match;
  const statusLabel = STATUS_COPY[status] || 'TBD';
  const isTeam1Winner = winnerId && team1?.id && winnerId === team1.id;
  const isTeam2Winner = winnerId && team2?.id && winnerId === team2.id;
  const penalties = match.penalties;
  const showPenalties = penalties && typeof penalties.team1 !== 'undefined' && typeof penalties.team2 !== 'undefined';
  const hasMatchCentre = status === 'completed' || status === 'simulated';
  const timelineType = match.timelineType || 'summary';

  const cardClasses = ['relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur transition cursor-pointer'];
  if (winnerId) {
    cardClasses.push('ring-1 ring-inset ring-anl-gold/60');
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(match);
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(match)}
      onKeyDown={handleKeyDown}
      className={cardClasses.join(' ')}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-anl-gold">{round}</p>
      <div className="mt-3 space-y-2">
        <div className={teamRowClasses(isTeam1Winner, !team1?.id)}>
          <div className="flex items-center gap-3">
            <TeamBadge team={team1} />
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">{team1?.name ?? 'To Be Determined'}</p>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40">{team1?.shortName ?? 'TBD'}</p>
            </div>
          </div>
          <span className="text-lg font-bold">{resolveScore(score?.team1)}</span>
        </div>
        <div className={teamRowClasses(isTeam2Winner, !team2?.id)}>
          <div className="flex items-center gap-3">
            <TeamBadge team={team2} />
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">{team2?.name ?? 'To Be Determined'}</p>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40">{team2?.shortName ?? 'TBD'}</p>
            </div>
          </div>
          <span className="text-lg font-bold">{resolveScore(score?.team2)}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[0.7rem] uppercase tracking-[0.35em] text-white/50">
        <span>{statusLabel}</span>
        {showPenalties && penalties && (
          <span>Pen {penalties.team1} - {penalties.team2}</span>
        )}
      </div>
      {hasMatchCentre && (
        <div className="mt-3 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-anl-gold/80">
          <span>{timelineType === 'play-by-play' ? 'Play by play available' : 'Simulated match centre'}</span>
          <Link
            href={`/bracket/match?id=${match.id}`}
            className="rounded-full border border-anl-gold/40 px-2 py-1 text-[0.6rem] font-semibold text-anl-gold hover:bg-anl-gold/10"
            onClick={(event) => event.stopPropagation()}
          >
            View
          </Link>
        </div>
      )}
    </motion.div>
  );
}
