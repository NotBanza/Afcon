// components/AdminTournamentManager.js
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import BracketTree from '@/components/bracket/BracketTree';
import MatchModal from '@/components/bracket/MatchModal';
import {
  fetchRegisteredTeams,
  listenToBracket,
  resetTournament,
  seedTournament,
  simulateMatch,
} from '@/services/bracketService';

const defaultBracket = {
  quarter: [],
  semi: [],
  final: [],
  matches: [],
  champion: null,
  teamCount: 0,
  seeded: false,
};

export default function AdminTournamentManager() {
  const [bracket, setBracket] = useState(defaultBracket);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminBusy, setAdminBusy] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [simulatingMatchId, setSimulatingMatchId] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [selectionHint, setSelectionHint] = useState(null);

  useEffect(() => {
    let unsubscribe;
    const handleError = (err) => {
      console.error('Admin bracket listener error:', err);
      setError(err?.message || 'Unable to load bracket data.');
      setLoading(false);
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };

    try {
      unsubscribe = listenToBracket(
        (data) => {
          setError(null);
          setBracket({
            quarter: data.quarter,
            semi: data.semi,
            final: data.final,
            matches: data.matches,
            champion: data.champion,
            teamCount: data.teamCount,
            seeded: data.seeded,
          });
          setSelectedMatch((current) => {
            if (!current) {
              return current;
            }
            const updated = data.matches.find((match) => match.id === current.id);
            return updated || current;
          });
          setLoading(false);
        },
        handleError,
      );
    } catch (err) {
      handleError(err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const loadTeams = async () => {
      setTeamsLoading(true);
      try {
        const teams = await fetchRegisteredTeams();
        if (!disposed) {
          setTeamOptions(teams);
          setSelectedTeamIds((current) => {
            if (current.length) {
              return current;
            }
            const defaults = teams.slice(0, 8).map((team) => team.id).filter(Boolean);
            return defaults;
          });
        }
      } catch (err) {
        console.error('Failed to load teams for seeding:', err);
        if (!disposed) {
          setError('Unable to load registered teams for manual seeding.');
        }
      } finally {
        if (!disposed) {
          setTeamsLoading(false);
        }
      }
    };

    loadTeams();

    return () => {
      disposed = true;
    };
  }, [setError]);

  const pendingMatches = useMemo(
    () => bracket.matches.filter((match) => match.status !== 'completed'),
    [bracket.matches],
  );
  const completedMatches = useMemo(
    () => bracket.matches.filter((match) => match.status === 'completed'),
    [bracket.matches],
  );

  const handleSeed = useCallback(async () => {
    if (selectedTeamIds.length !== 8) {
      setError('Please select exactly 8 teams before seeding.');
      return;
    }

    const uniqueCount = new Set(selectedTeamIds).size;
    if (uniqueCount !== 8) {
      setError('Each seeded team must be unique.');
      return;
    }

    setAdminBusy('seed');
    setError(null);
    try {
      await seedTournament(selectedTeamIds);
    } catch (err) {
      console.error('Admin seed error:', err);
      setError(err.message || 'Failed to seed tournament.');
    } finally {
      setAdminBusy(null);
    }
  }, [selectedTeamIds]);

  const handleToggleTeam = useCallback((teamId) => {
    if (!teamId) {
      return;
    }

    setSelectedTeamIds((current) => {
      if (current.includes(teamId)) {
        setSelectionHint(null);
        return current.filter((id) => id !== teamId);
      }

      if (current.length >= 8) {
        setSelectionHint('You can only select eight federations. Deselect one to change the lineup.');
        return current;
      }

      setSelectionHint(null);
      return [...current, teamId];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectionHint(null);
    setSelectedTeamIds([]);
  }, []);

  const handleReset = useCallback(async () => {
    setAdminBusy('reset');
    setError(null);
    try {
      await resetTournament();
    } catch (err) {
      console.error('Admin reset error:', err);
      setError(err.message || 'Failed to reset tournament.');
    } finally {
      setAdminBusy(null);
    }
  }, []);

  const handleMatchSelect = useCallback((match) => {
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
    setError(null);
    try {
      await simulateMatch(match.id, mode);
    } catch (err) {
      console.error('Admin simulate error:', err);
      setError(err.message || 'Failed to simulate match.');
    } finally {
      setSimulatingMatchId(null);
    }
  }, []);

  const readyToSeed = selectedTeamIds.length === 8 && new Set(selectedTeamIds).size === 8;
  const showReset = bracket.matches.length > 0;
  const showSeed = !bracket.seeded;
  const champion = bracket.champion;
  const simulating = selectedMatch && simulatingMatchId === selectedMatch.id;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-sm text-white/60">
        Loading live tournament data...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-white/10 bg-anl-ink/80 p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-anl-gold">Tournament Control</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Administrator Console</h2>
            <p className="mt-3 text-sm text-white/70">
              Seed, simulate, and reset matches in real time. All updates stream live into the public bracket page.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-xs uppercase tracking-[0.35em] text-white/60">
            Teams Registered: <span className="ml-2 text-white">{bracket.teamCount}</span>
            <br />
            Seeded: <span className="ml-2 text-white">{bracket.seeded ? 'Yes' : 'No'}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {showSeed && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={adminBusy === 'seed' || !readyToSeed}
              className="rounded-full border border-anl-gold bg-anl-emerald px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminBusy === 'seed' ? 'Seeding…' : 'Seed Tournament'}
            </button>
          )}
          {showReset && (
            <button
              type="button"
              onClick={handleReset}
              disabled={adminBusy === 'reset'}
              className="rounded-full border border-white/20 bg-black/40 px-6 py-2 text-sm font-semibold text-white transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminBusy === 'reset' ? 'Resetting…' : 'Reset Bracket'}
            </button>
          )}
          {showSeed && (
            <span className="text-xs uppercase tracking-[0.35em] text-white/40">
              Choose exactly 8 teams below. Selected {selectedTeamIds.length}/8.
            </span>
          )}
        </div>
        {error && (
          <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        )}
      </header>

      {champion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-anl-gold/50 bg-gradient-to-r from-anl-gold/20 via-transparent to-anl-gold/10 p-[1px]"
        >
          <div className="rounded-[calc(1.5rem-1px)] bg-anl-ink/85 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Current Champion</p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">{champion.name}</h3>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">{champion.countryName}</p>
              </div>
              <div className="rounded-full border border-anl-gold/40 bg-anl-gold/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-anl-gold">
                Title Secured
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showSeed && (
        <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Manual Seeding</p>
          <p className="mt-3 text-sm text-white/60">
            Tap the eight federations you want in the knockout bracket, then lock them in. Ratings help you spot the heavy hitters.
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                  Selected {selectedTeamIds.length}/8
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeamIds(teamOptions.slice(0, 8).map((team) => team.id).filter(Boolean));
                      setSelectionHint(null);
                    }}
                    className="rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60 hover:border-anl-gold/40 hover:text-anl-gold"
                    disabled={teamsLoading || adminBusy === 'seed' || teamOptions.length === 0}
                  >
                    Top-Rated 8
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60 hover:border-red-400/60 hover:text-red-200"
                    disabled={teamsLoading || adminBusy === 'seed' || selectedTeamIds.length === 0}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {teamsLoading ? (
                  <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">Loading registered teams…</p>
                ) : teamOptions.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">No registered teams found yet.</p>
                ) : (
                  teamOptions.map((team) => {
                    const selected = selectedTeamIds.includes(team.id);
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => handleToggleTeam(team.id)}
                        disabled={adminBusy === 'seed'}
                        className={`flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          selected
                            ? 'border-anl-gold bg-anl-ink/80 text-anl-gold shadow-lg shadow-anl-gold/20'
                            : 'border-white/15 bg-black/30 text-white/80 hover:border-anl-gold/60 hover:text-anl-gold'
                        }`}
                      >
                        <span className="text-sm font-semibold">{team.name}</span>
                        <span className="mt-1 text-xs uppercase tracking-[0.35em] text-white/40">
                          Rating {team.rating ?? 0}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-anl-ink/80 p-4 text-sm text-white/70">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">Your selection</p>
              {selectedTeamIds.length === 0 ? (
                <p className="mt-3 text-sm text-white/60">Pick up to eight federations from the list to the left.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs text-white/70">
                  {selectedTeamIds.map((teamId, index) => {
                    const team = teamOptions.find((option) => option.id === teamId);
                    return (
                      <li key={teamId} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <span>
                          <span className="mr-2 text-white/40">{index + 1}.</span>
                          {team ? team.name : `Unknown team ${teamId}`}
                        </span>
                        <span className="text-white/40">Rating {team?.rating ?? 0}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {selectionHint && (
                <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/15 px-3 py-2 text-xs text-yellow-200">
                  {selectionHint}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-anl-ink/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Live Bracket</p>
        <div className="mt-5">
          <BracketTree
            quarter={bracket.quarter}
            semi={bracket.semi}
            final={bracket.final}
            teamCount={bracket.teamCount}
            onMatchSelect={handleMatchSelect}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Pending Matches</p>
          {pendingMatches.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">All fixtures completed.</p>
          ) : (
            <ul className="mt-4 space-y-4 text-sm text-white/80">
              {pendingMatches.map((match) => (
                <li key={match.id} className="rounded-2xl border border-white/10 bg-anl-ink/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{match.team1?.name ?? 'TBD'} vs {match.team2?.name ?? 'TBD'}</p>
                      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/40">{match.round}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMatchSelect(match)}
                      className="rounded-full border border-anl-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-anl-gold hover:bg-anl-gold/10"
                    >
                      Inspect
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Completed Matches</p>
          {completedMatches.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">No results recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-4 text-sm text-white/70">
              {completedMatches.map((match) => (
                <li key={match.id} className="rounded-2xl border border-white/10 bg-anl-ink/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{match.team1?.name ?? 'TBD'} vs {match.team2?.name ?? 'TBD'}</p>
                      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/40">{match.round}</p>
                    </div>
                    {match.score && (
                      <span className="rounded-full bg-anl-gold px-3 py-1 text-xs font-bold text-anl-ink">
                        {match.score.team1} - {match.score.team2}
                      </span>
                    )}
                  </div>
                  {match.commentary && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60 whitespace-pre-line">
                      <strong className="mr-1 text-anl-gold">{match.commentaryType === 'ai-play' ? 'AI Commentary:' : 'Quick Summary:'}</strong>
                      {match.commentary}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <MatchModal
        match={selectedMatch}
        onClose={handleCloseModal}
        onSimulate={handleSimulate}
        isAdmin
        simulating={!!simulating}
      />
    </div>
  );
}