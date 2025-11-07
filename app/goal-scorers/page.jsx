'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

export default function GoalScorersPage() {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setError('Live goals data unavailable.');
      setLoading(false);
      return () => {};
    }

    let unsubscribe;
    try {
      const matchesRef = collection(db, 'matches');
      const completedMatchesQuery = query(
        matchesRef,
        where('status', 'in', ['completed', 'simulated']),
      );
      unsubscribe = onSnapshot(
        completedMatchesQuery,
        (snapshot) => {
          setError(null);
          const tallies = new Map();

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (!Array.isArray(data.goalscorers)) {
              return;
            }

            data.goalscorers.forEach((goal) => {
              const key = `${goal.teamId || 'unknown'}::${goal.playerId || goal.scorerName}`;
              const existing = tallies.get(key) || {
                id: key,
                name: goal.scorerName || 'Unknown Player',
                country: goal.playerCountry || goal.teamCountry || 'Nation Unlisted',
                federation: goal.teamName || goal.teamCountry || 'Unregistered Federation',
                goals: 0,
              };
              existing.goals += 1;
              tallies.set(key, existing);
            });
          });

          const aggregated = Array.from(tallies.values()).sort((a, b) => {
            if (b.goals !== a.goals) {
              return b.goals - a.goals;
            }
            return a.name.localeCompare(b.name);
          });

          setScorers(aggregated.slice(0, 50));
          setLoading(false);
        },
        (err) => {
          console.error('Top scorers listener error:', err);
          setError('Unable to load goal scorers right now.');
          setLoading(false);
        },
      );
    } catch (err) {
      console.error('Top scorers listener init failed:', err);
      setError('Unable to load goal scorers right now.');
      setLoading(false);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const podium = useMemo(() => scorers.slice(0, 3), [scorers]);
  const rest = useMemo(() => scorers.slice(3), [scorers]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-anl-ink via-anl-ink/95 to-black pb-24 text-white">
      <motion.section
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="border-b border-white/10 bg-anl-ink/90 py-16"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-anl-gold">Golden Boot Race</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Top Goal Scorers</h1>
            <p className="mt-4 max-w-3xl text-sm text-white/70">
              Real-time updates as the ANL knockout bracket unfolds. Keep track of the players lighting up the big stage.
            </p>
          </div>
        </div>
      </motion.section>

      <div className="mx-auto mt-10 w-full max-w-5xl px-6">
        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-sm text-white/60">
            Loading goal scorers...
          </div>
        ) : (
          <div className="space-y-10">
            <section className="rounded-3xl border border-anl-gold/40 bg-anl-ink/80 p-6 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Podium Leaders</p>
              {podium.length === 0 ? (
                <p className="mt-4 text-sm text-white/60">No goals recorded yet. Come back after the opening fixtures!</p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {podium.map((scorer, index) => (
                    <div key={scorer.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Rank {index + 1}</p>
                      <h3 className="mt-3 text-lg font-semibold text-white">{scorer.name}</h3>
                      <p className="text-sm text-white/60">{scorer.country}</p>
                      <p className="mt-4 text-4xl font-extrabold text-anl-gold">{scorer.goals}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/40">{scorer.federation}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-anl-ink/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Chasing Pack</p>
              {rest.length === 0 ? (
                <p className="mt-4 text-sm text-white/60">No additional goal scorers yet.</p>
              ) : (
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-black/30 text-xs uppercase tracking-[0.35em] text-white/50">
                      <tr>
                        <th className="px-4 py-3 text-left">Rank</th>
                        <th className="px-4 py-3 text-left">Player</th>
                        <th className="px-4 py-3 text-left">Federation</th>
                        <th className="px-4 py-3 text-left">Goals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rest.map((scorer, index) => (
                        <tr key={scorer.id} className="bg-black/20 text-white/80">
                          <td className="px-4 py-3">{index + 4}</td>
                          <td className="px-4 py-3">
                            <div className="text-white">{scorer.name}</div>
                            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-white/40">{scorer.country}</div>
                          </td>
                          <td className="px-4 py-3">{scorer.federation}</td>
                          <td className="px-4 py-3 font-semibold text-white">{scorer.goals}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
