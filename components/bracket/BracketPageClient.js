'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import BracketTree from '@/components/bracket/BracketTree';
import MatchModal from '@/components/bracket/MatchModal';
import { listenToBracket, resetTournament, seedTournament, simulateMatch } from '@/services/bracketService';
import { useAuth } from '@/context/AuthContext';

const EMPTY_BRACKET = {
  quarter: [],
  semi: [],
  final: [],
  champion: null,
  teamCount: 0,
  seeded: false,
  matches: [],
};

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

export default function BracketPageClient({ initialBracketData }) {
  const { user, loading: authLoading } = useAuth();
  const [bracket, setBracket] = useState(initialBracketData ?? EMPTY_BRACKET);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [adminBusy, setAdminBusy] = useState(null);
  const [simulatingMatchId, setSimulatingMatchId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    setBracket(initialBracketData ?? EMPTY_BRACKET);
  }, [initialBracketData]);

  const isAdmin = useMemo(() => user?.role === 'administrator', [user]);

  useEffect(() => {
    if (!isAdmin || authLoading) {
      return undefined;
    }

    const unsubscribe = listenToBracket(
      (data) => {
        setBracket({
          quarter: data.quarter,
          semi: data.semi,
          final: data.final,
          champion: data.champion,
          teamCount: data.teamCount,
          seeded: data.seeded,
          matches: data.matches,
        });
      },
      (err) => {
        console.error('Bracket listener error:', err);
        setActionError(err?.message || 'Unable to refresh bracket in real time.');
      },
    );

    return () => {
      unsubscribe?.();
    };
  }, [isAdmin, authLoading]);

  const showSeedButton = isAdmin && !bracket.seeded;
  const showResetButton = isAdmin && bracket.matches.length > 0;

  const handleSeed = useCallback(async () => {
    if (!isAdmin) {
      return;
    }
    setAdminBusy('seed');
    setActionError(null);
    try {
      await seedTournament();
    } catch (err) {
      console.error('Seed tournament failed:', err);
      setActionError(err.message || 'Seeding failed.');
    } finally {
      setAdminBusy(null);
    }
  }, [isAdmin]);

  const handleReset = useCallback(async () => {
    if (!isAdmin) {
      return;
    }
    setAdminBusy('reset');
    setActionError(null);
    try {
      await resetTournament();
    } catch (err) {
      console.error('Reset tournament failed:', err);
      setActionError(err.message || 'Reset failed.');
    } finally {
      setAdminBusy(null);
    }
  }, [isAdmin]);

  const handleSelectMatch = useCallback((match) => {
    setSelectedMatch(match);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMatch(null);
  }, []);

  const handleSimulate = useCallback(async (match, mode) => {
    if (!match) {
      return;
    }
    setSimulatingMatchId(match.id);
    setActionError(null);
    try {
      await simulateMatch(match.id, mode);
    } catch (err) {
      console.error('Simulation failed:', err);
      setActionError(err.message || 'Simulation failed.');
    } finally {
      setSimulatingMatchId(null);
    }
  }, []);

  const readyToSeed = bracket.teamCount >= 8;
  const simulating = selectedMatch && simulatingMatchId === selectedMatch.id;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-anl-ink via-anl-ink/95 to-black pb-24 text-white">
      <motion.section
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden border-b border-white/10 bg-anl-ink/90 py-16"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(209,178,18,0.12)_0,_rgba(0,0,0,0)_70%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-anl-gold">ANL Championship</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Tournament Bracket</h1>
          </div>
          <p className="max-w-3xl text-sm text-white/70">
            Track every knockout clash as federations fight for the ANL title. Administrators can seed and simulate matches in real time,
            while supporters follow the road to the final.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.35em] text-white/50">
            <span>Registered Teams: {bracket.teamCount}</span>
            <span>Seeded: {bracket.seeded ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </motion.section>

      <div className="mx-auto mt-10 w-full max-w-6xl px-6">
        {actionError && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {actionError}
          </motion.div>
        )}

        {isAdmin && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="mb-10 rounded-3xl border border-white/10 bg-anl-ink/70 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Administrator Controls</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {showSeedButton && (
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={adminBusy === 'seed' || !readyToSeed}
                  className="rounded-full border border-anl-gold bg-anl-emerald px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminBusy === 'seed' ? 'Seeding…' : 'Seed Tournament'}
                </button>
              )}
              {showResetButton && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={adminBusy === 'reset'}
                  className="rounded-full border border-white/20 bg-black/40 px-6 py-2 text-sm font-semibold text-white transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminBusy === 'reset' ? 'Resetting…' : 'Reset Bracket'}
                </button>
              )}
              {!readyToSeed && showSeedButton && (
                <span className="text-xs uppercase tracking-[0.35em] text-white/40">
                  Need {Math.max(0, 8 - bracket.teamCount)} more team{Math.max(0, 8 - bracket.teamCount) === 1 ? '' : 's'} to seed.
                </span>
              )}
            </div>
          </motion.section>
        )}

        {bracket.champion && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="mb-10 overflow-hidden rounded-3xl border border-anl-gold/50 bg-gradient-to-r from-anl-gold/20 via-transparent to-anl-gold/10 p-[1px]"
          >
            <div className="h-full w-full rounded-[calc(1.5rem-1px)] bg-anl-ink/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Champion</p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{bracket.champion.name}</h2>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">{bracket.champion.countryName}</p>
                </div>
                <div className="rounded-full border border-anl-gold/40 bg-anl-gold/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-anl-gold">
                  ANL Champions
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0.3}
        >
          <BracketTree
            quarter={bracket.quarter}
            semi={bracket.semi}
            final={bracket.final}
            teamCount={bracket.teamCount}
            onMatchSelect={handleSelectMatch}
          />
        </motion.section>
      </div>

      <MatchModal
        match={selectedMatch}
        onClose={handleCloseModal}
        onSimulate={handleSimulate}
        isAdmin={isAdmin}
        simulating={!!simulating}
      />
    </main>
  );
}
