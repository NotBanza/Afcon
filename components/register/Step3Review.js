'use client';

import Image from 'next/image';
import useTeamRating from '@/hooks/useTeamRating';

export default function Step3Review({ federation, country, players, onSubmit, submitting, error }) {
  const { average } = useTeamRating(players);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Review & Confirm</h2>
        <p className="mt-2 text-sm text-white/65">Double-check federation details before submitting to the ANL registry.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-anl-ink/70 p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-20 overflow-hidden rounded-xl border border-white/10">
              <Image src={country.flag} alt={`${country.name} flag`} fill sizes="80px" className="object-cover" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-anl-gold">Federation</p>
              <p className="text-xl font-semibold text-white">{federation.federationName}</p>
              <p className="text-sm text-white/60">{country.name}</p>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-white/75">
            <p>
              <span className="font-semibold text-white/90">Manager:</span> {federation.managerName}
            </p>
            <p>
              <span className="font-semibold text-white/90">Email:</span> {federation.email}
            </p>
            <p>
              <span className="font-semibold text-white/90">Team Rating:</span> {average}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-anl-ink/70 p-6 shadow-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-anl-gold">Squad Overview</p>
          <ul className="space-y-2 text-sm text-white/75 max-h-64 overflow-y-auto pr-2">
            {players.map((player) => (
              <li key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <p className="text-white">{player.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {player.naturalPosition} • {player.isCaptain ? 'Captain' : 'Squad'}
                  </p>
                </div>
                <span className="rounded-full bg-anl-gold px-3 py-1 text-xs font-semibold text-anl-ink">
                  {(player.ratings?.[player.naturalPosition] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-full border border-anl-gold bg-anl-emerald px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Federation'}
        </button>
      </div>
    </div>
  );
}
