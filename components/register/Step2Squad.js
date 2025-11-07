'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import useTeamRating from '@/hooks/useTeamRating';
import { POSITION_OPTIONS, generateRandomSquad } from '@/lib/randomPlayerGenerator';

function clampRating(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export default function Step2Squad({ players, setPlayers, onAutofill, errors }) {
  const { average, breakdown } = useTeamRating(players);

  const handleAutofill = useCallback(() => {
    const freshSquad = generateRandomSquad(23).map((player, index) => ({
      ...player,
      isCaptain: index === 0,
    }));
    setPlayers(freshSquad);
    if (onAutofill) {
      onAutofill();
    }
  }, [setPlayers, onAutofill]);

  const updatePlayer = (id, changes) => {
    setPlayers((current) =>
      current.map((player) =>
        player.id === id
          ? {
              ...player,
              ...changes,
              ratings: changes.ratings ? { ...player.ratings, ...changes.ratings } : player.ratings,
            }
          : player,
      ),
    );
  };

  const handleCaptainToggle = (id) => {
    setPlayers((current) =>
      current.map((player) => ({
        ...player,
        isCaptain: player.id === id,
      })),
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Assemble Your Squad</h2>
          <p className="mt-2 text-sm text-white/65">
            Generate an entire roster automatically or fine-tune individual player attributes.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleAutofill}
          className="rounded-full border border-anl-gold bg-anl-emerald px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Autofill 23 Players
        </motion.button>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-anl-ink/60 p-5 shadow-xl">
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {(
            [
              { label: 'Team Average', value: average },
              { label: 'Goalkeepers', value: breakdown.GK },
              { label: 'Defenders', value: breakdown.DF },
              { label: 'Midfielders', value: breakdown.MD },
              { label: 'Attackers', value: breakdown.AT },
            ]
          ).map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-anl-gold">{metric.value || 0}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          {players.length > 0 ? (
            <table className="min-w-full text-left text-sm text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-white/50">
                  <th className="px-3 py-3">Player</th>
                  <th className="px-3 py-3">Natural</th>
                  <th className="px-3 py-3 text-center">GK</th>
                  <th className="px-3 py-3 text-center">DF</th>
                  <th className="px-3 py-3 text-center">MD</th>
                  <th className="px-3 py-3 text-center">AT</th>
                  <th className="px-3 py-3 text-center">Captain</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-3">
                      <input
                        value={player.name}
                        onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-anl-gold"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={player.naturalPosition}
                        onChange={(event) => updatePlayer(player.id, { naturalPosition: event.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-anl-gold"
                      >
                        {POSITION_OPTIONS.map((option) => (
                          <option key={option} value={option} className="bg-anl-ink text-white">
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    {['GK', 'DF', 'MD', 'AT'].map((slot) => (
                      <td key={slot} className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={player.ratings[slot] ?? 0}
                          onChange={(event) =>
                            updatePlayer(player.id, {
                              ratings: {
                                [slot]: clampRating(event.target.value),
                              },
                            })
                          }
                          className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:border-anl-gold"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="radio"
                        name="captain"
                        checked={player.isCaptain}
                        onChange={() => handleCaptainToggle(player.id)}
                        className="h-4 w-4 accent-anl-gold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-white/60">
              No players yet. Use “Autofill 23 Players” to generate a squad.
            </div>
          )}
        </div>
      </div>
      {errors?.players && <p className="text-sm text-red-300">{errors.players}</p>}
    </div>
  );
}
