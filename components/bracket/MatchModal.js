'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

const SCORE_PLACEHOLDER = '–';

const STAT_DEFINITIONS = [
  {
    key: 'possession',
    label: 'Possession',
    tooltip: 'Share of ball possession as a percentage.',
    suffix: '%',
    highlight: 'higher',
    renderBar: true,
  },
  {
    key: 'shots',
    label: 'Shots',
    tooltip: 'Total attempts on goal registered in the match.',
    highlight: 'higher',
  },
  {
    key: 'fouls',
    label: 'Fouls Committed',
    tooltip: 'Number of fouls committed by each side.',
    highlight: 'higher-negative',
  },
  {
    key: 'yellowCards',
    label: 'Yellow Cards',
    tooltip: 'Disciplinary cautions issued to players.',
    highlight: 'higher-negative',
  },
  {
    key: 'redCards',
    label: 'Red Cards',
    tooltip: 'Straight reds or double-yellows shown.',
    highlight: 'higher-negative',
  },
];

function TeamRow({ team, score, winner }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 ${
      winner ? 'border-anl-gold bg-anl-ink/80 shadow-glow' : 'border-white/10 bg-black/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-16 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {team.flag ? (
            <Image src={team.flag} alt={`${team.name} flag`} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/50">
              {team.shortName}
            </div>
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-white">{team.name}</p>
          <p className="text-[0.7rem] uppercase tracking-[0.35em] text-white/40">{team.managerName || team.countryName}</p>
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white">{typeof score === 'number' ? score : SCORE_PLACEHOLDER}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-anl-gold">{team.shortName}</span>
      </div>
    </div>
  );
}

export default function MatchModal({ match, onClose, onSimulate, isAdmin = false, simulating = false }) {
  const [mode, setMode] = useState('quick');
  const [activeTab, setActiveTab] = useState('summary');

  const safeMatch = match || {};
  const team1 = safeMatch.team1 || {};
  const team2 = safeMatch.team2 || {};
  const winnerId = safeMatch.winnerId;
  const score = safeMatch.score;
  const commentary = safeMatch.commentary;
  const commentaryType = safeMatch.commentaryType;
  const status = safeMatch.status;
  const round = safeMatch.round;
  const penalties = safeMatch.penalties;
  const resolution = safeMatch.resolution;
  const stats = safeMatch.stats;
  const isComplete = status === 'completed';

  const resolvedStats = useMemo(() => {
    if (!stats || !team1?.id || !team2?.id) {
      return null;
    }

    const team1Id = team1.id;
    const team2Id = team2.id;

    const buildEntry = (key) => {
      const metric = stats[key];
      if (!metric) {
        return { team1Value: null, team2Value: null };
      }
      return {
        team1Value: metric[team1Id] ?? null,
        team2Value: metric[team2Id] ?? null,
      };
    };

    return STAT_DEFINITIONS.map((definition) => ({
      ...definition,
      ...buildEntry(definition.key),
    }));
  }, [stats, team1, team2]);

  if (!match) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-anl-ink/95 p-8 shadow-2xl"
          variants={modalVariants}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 hover:border-anl-gold hover:text-anl-gold"
          >
            Close
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-anl-gold">{round}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Match Centre</h2>

          <div className="mt-6 space-y-4">
            <TeamRow team={team1} score={score?.team1} winner={winnerId && winnerId === team1.id} />
            <TeamRow team={team2} score={score?.team2} winner={winnerId && winnerId === team2.id} />
          </div>

          <div className="mt-6 flex gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`rounded-full border px-3 py-1 transition ${
                activeTab === 'summary' ? 'border-anl-gold bg-anl-gold/20 text-anl-gold' : 'border-white/15 hover:border-anl-gold hover:text-anl-gold'
              }`}
            >
              Match Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`rounded-full border px-3 py-1 transition ${
                activeTab === 'stats' ? 'border-anl-gold bg-anl-gold/20 text-anl-gold' : 'border-white/15 hover:border-anl-gold hover:text-anl-gold'
              }`}
              disabled={!resolvedStats}
            >
              Match Stats
            </button>
          </div>

          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 space-y-5"
            >
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">Status</p>
                  <p className="mt-1 font-semibold text-white">{status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">Resolution</p>
                  <p className="mt-1 font-semibold text-white">{resolution || (isComplete ? 'Full Time' : 'Not played')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">Penalties</p>
                  <p className="mt-1 font-semibold text-white">
                    {penalties ? `${penalties.team1}-${penalties.team2}` : 'None'}
                  </p>
                </div>
              </div>

              {commentary && (
                <div className="rounded-2xl border border-white/10 bg-anl-ink/70 p-5 text-sm text-white/75">
                  <p className="text-xs uppercase tracking-[0.35em] text-anl-gold">{commentaryType === 'ai-play' ? 'AI Commentary' : 'Match Summary'}</p>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-white/80">{commentary}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 space-y-5"
            >
              {!resolvedStats ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
                  Stats will appear after the match has been simulated.
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedStats.map(({ key, label, tooltip, suffix, renderBar, highlight, team1Value, team2Value }) => {
                    const team1Highlight = (() => {
                      if (team1Value === null || team2Value === null) {
                        return false;
                      }
                      if (highlight === 'higher') {
                        return team1Value > team2Value;
                      }
                      if (highlight === 'higher-negative') {
                        return team1Value > team2Value;
                      }
                      if (highlight === 'lower') {
                        return team1Value < team2Value;
                      }
                      return false;
                    })();
                    const team2Highlight = (() => {
                      if (team1Value === null || team2Value === null) {
                        return false;
                      }
                      if (highlight === 'higher') {
                        return team2Value > team1Value;
                      }
                      if (highlight === 'higher-negative') {
                        return team2Value > team1Value;
                      }
                      if (highlight === 'lower') {
                        return team2Value < team1Value;
                      }
                      return false;
                    })();

                    const formattedTeam1 = team1Value === null ? '—' : `${team1Value}${suffix || ''}`;
                    const formattedTeam2 = team2Value === null ? '—' : `${team2Value}${suffix || ''}`;

                    const highlightClasses = {
                      higher: 'border-anl-gold/60 bg-anl-gold/10 text-anl-gold',
                      'higher-negative': 'border-red-400/40 bg-red-500/10 text-red-200',
                      lower: 'border-anl-emerald/50 bg-anl-emerald/10 text-anl-emerald',
                    };

                    const team1Class = team1Highlight ? highlightClasses[highlight] : 'border-white/10 bg-black/30 text-white';
                    const team2Class = team2Highlight ? highlightClasses[highlight] : 'border-white/10 bg-black/30 text-white';

                    return (
                      <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-white" title={tooltip}>{label}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold transition ${team1Class}`}>
                              <span className="block text-xs uppercase tracking-[0.35em] text-white/50 sm:text-[0.6rem]">{team1.shortName}</span>
                              <span className="text-base">{formattedTeam1}</span>
                            </div>
                            <div className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold transition ${team2Class}`}>
                              <span className="block text-xs uppercase tracking-[0.35em] text-white/50 sm:text-[0.6rem]">{team2.shortName}</span>
                              <span className="text-base">{formattedTeam2}</span>
                            </div>
                          </div>
                        </div>
                        {renderBar && team1Value !== null && team2Value !== null && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-white/50">
                              <span>{team1.shortName} {team1Value}%</span>
                              <span>{team2.shortName} {team2Value}%</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${team1Value}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-anl-emerald to-anl-gold"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {isAdmin && status !== 'completed' && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Administrator Controls</p>
                <div className="mt-1 flex gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                  <button
                    type="button"
                    onClick={() => setMode('quick')}
                    className={`rounded-full border px-3 py-1 transition ${
                      mode === 'quick' ? 'border-anl-gold bg-anl-gold/20 text-anl-gold' : 'border-white/15 text-white/60'
                    }`}
                  >
                    Quick Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('play')}
                    className={`rounded-full border px-3 py-1 transition ${
                      mode === 'play' ? 'border-anl-gold bg-anl-gold/20 text-anl-gold' : 'border-white/15 text-white/60'
                    }`}
                  >
                    Story Mode
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={simulating}
                onClick={() => onSimulate?.(match, mode)}
                className="rounded-full border border-anl-gold bg-anl-emerald px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {simulating ? 'Simulating…' : 'Simulate Match'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
