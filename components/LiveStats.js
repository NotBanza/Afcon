'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { BRACKET_ROUNDS } from '@/lib/seeding';
import { mapTeamSnapshot } from '@/lib/teamUtils';

export default function LiveStats() {
  const [teamCount, setTeamCount] = useState(null);
  const [scorers, setScorers] = useState([]);
  const [teamCountError, setTeamCountError] = useState(null);
  const [scorersError, setScorersError] = useState(null);
  const [championInfo, setChampionInfo] = useState({ status: 'loading', team: null, message: null });
  const championCacheRef = useRef(new Map());

  useEffect(() => {
    if (!db) {
      setTeamCountError('Live data unavailable.');
      setScorersError('Live data unavailable.');
      setChampionInfo({ status: 'error', team: null, message: 'Champion details unavailable right now.' });
      return () => {};
    }

    const teamsRef = collection(db, 'teams');
    const playersRef = collection(db, 'players');
    const finalMatchQuery = query(
      collection(db, 'matches'),
      where('round', '==', BRACKET_ROUNDS.FINAL),
      limit(1),
    );

    let unsubscribeTeams;
    let unsubscribeScorers;
    let unsubscribeChampion;
    let isActive = true;

    try {
      unsubscribeTeams = onSnapshot(
        teamsRef,
        (snapshot) => {
          if (!isActive) return;
          setTeamCountError(null);
          setTeamCount(snapshot.size);
        },
        (err) => {
          console.error('Teams listener error', err);
          if (!isActive) return;
          setTeamCountError('Unable to load team statistics');
        },
      );
    } catch (err) {
      console.error('Teams listener initialization failed', err);
      setTeamCountError('Unable to load team statistics');
    }

    try {
      unsubscribeScorers = onSnapshot(
        query(playersRef, orderBy('goals', 'desc'), limit(3)),
        (snapshot) => {
          if (!isActive) return;
          setScorersError(null);
          setScorers(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              country: doc.data().country,
              goals: doc.data().goals ?? 0,
            })),
          );
        },
        (err) => {
          console.error('Scorers listener error', err);
          if (!isActive) return;
          setScorersError('Unable to load goal scorers');
        },
      );
    } catch (err) {
      console.error('Scorers listener initialization failed', err);
      setScorersError('Unable to load goal scorers');
    }

    const resolveChampion = async (winnerId) => {
      if (!isActive) {
        return;
      }
      if (!winnerId) {
        setChampionInfo({ status: 'pending', team: null, message: 'Final result yet to be decided.' });
        return;
      }

      const cached = championCacheRef.current.get(winnerId);
      if (cached) {
        if (!isActive) {
          return;
        }
        setChampionInfo({ status: 'ready', team: cached, message: null });
        return;
      }

      try {
        if (!isActive) {
          return;
        }
        setChampionInfo((prev) => ({
          status: prev.status === 'ready' ? prev.status : 'loading-team',
          team: prev.team,
          message: prev.status === 'ready' ? null : 'Crowning champions…',
        }));
        const teamRef = doc(db, 'teams', winnerId);
        const teamSnap = await getDoc(teamRef);
        if (!isActive) {
          return;
        }
        if (!teamSnap.exists()) {
          setChampionInfo({ status: 'missing', team: null, message: 'We could not find the champion details.' });
          return;
        }
        const teamDetails = mapTeamSnapshot(teamSnap);
        championCacheRef.current.set(winnerId, teamDetails);
        setChampionInfo({ status: 'ready', team: teamDetails, message: null });
      } catch (err) {
        console.error('Champion fetch failed', err);
        if (!isActive) {
          return;
        }
        setChampionInfo({ status: 'error', team: null, message: 'Unable to load champion details.' });
      }
    };

    try {
      unsubscribeChampion = onSnapshot(
        finalMatchQuery,
        (snapshot) => {
          if (!isActive) return;
          if (snapshot.empty) {
            setChampionInfo({
              status: 'unseeded',
              team: null,
              message: 'The final showdown will announce our champions once brackets are complete.',
            });
            return;
          }

          const matchDoc = snapshot.docs[0];
          const data = matchDoc?.data?.();
          if (!data) {
            setChampionInfo({ status: 'error', team: null, message: 'Champion details unavailable right now.' });
            return;
          }

          if (data.status === 'completed' && data.winnerId) {
            resolveChampion(data.winnerId);
            return;
          }

          if (data.team1Id && data.team2Id) {
            setChampionInfo({ status: 'pending', team: null, message: 'Final result yet to be decided.' });
          } else {
            setChampionInfo({
              status: 'awaiting-finalists',
              team: null,
              message: 'Finalists will be confirmed soon – keep watching the bracket.',
            });
          }
        },
        (err) => {
          console.error('Champion listener error', err);
          if (!isActive) return;
          const message = err?.code === 'permission-denied'
            ? 'Sign in to reveal champion details.'
            : 'Unable to determine the champion right now.';
          setChampionInfo({ status: 'error', team: null, message });
        },
      );
    } catch (err) {
      console.error('Champion listener initialization failed', err);
      setChampionInfo({ status: 'error', team: null, message: 'Unable to determine the champion right now.' });
    }

    return () => {
      isActive = false;
      if (typeof unsubscribeTeams === 'function') {
        unsubscribeTeams();
      }
      if (typeof unsubscribeScorers === 'function') {
        unsubscribeScorers();
      }
      if (typeof unsubscribeChampion === 'function') {
        unsubscribeChampion();
      }
    };
  }, []);

  return (
    <motion.section
      className="mt-16 grid gap-8 rounded-3xl border border-white/10 bg-anl-ink/70 p-8 shadow-xl backdrop-blur md:grid-cols-[1fr,1.2fr]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="flex flex-col justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">In Numbers</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">African football, live.</h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            Teams and scorers update in real-time from the ANL database to keep supporters in the loop every second.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner">
          <p className="text-sm text-white/60">Federations registered</p>
          {teamCountError ? (
            <p className="mt-2 text-sm text-red-200">{teamCountError}</p>
          ) : (
            <p className="mt-2 text-5xl font-extrabold text-anl-gold">
              {teamCount !== null ? teamCount : <span className="text-base text-white/50">Loading…</span>}
            </p>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Top goal scorers</p>
        <div className="mt-4 space-y-4">
          {championInfo.status === 'ready' && championInfo.team && (
            <div className="rounded-xl border border-anl-gold/40 bg-anl-gold/10 p-4 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-anl-gold">champions crowned</p>
              <p className="mt-2 text-xl font-semibold text-anl-gold">{championInfo.team.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-anl-gold/80">
                {championInfo.team.countryName || 'African Nations League' }
              </p>
            </div>
          )}
          {championInfo.status !== 'ready' && championInfo.message && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              {championInfo.message}
            </div>
          )}
          <ul className="space-y-4">
            {scorersError && (
              <li className="rounded-xl border border-red-400/40 bg-red-500/15 p-4 text-sm text-red-100">
                {scorersError}
              </li>
            )}
            {!scorersError && scorers.length === 0 && (
              <li className="rounded-xl border border-white/5 bg-black/30 p-4 text-sm text-white/60">
                Waiting for the first goals to light up the chart.
              </li>
            )}
            {!scorersError &&
              scorers.map((scorer) => (
                <li
                  key={scorer.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-anl-ink/70 px-4 py-3 shadow-inner"
                >
                  <div>
                    <p className="text-base font-semibold text-white">{scorer.name ?? 'Unknown Player'}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {scorer.country ?? 'Nation'}
                    </p>
                  </div>
                  <span className="rounded-full bg-anl-gold px-3 py-1 text-sm font-bold text-anl-ink shadow-glow">
                    {scorer.goals ?? 0} {scorer.goals === 1 ? 'Goal' : 'Goals'}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
