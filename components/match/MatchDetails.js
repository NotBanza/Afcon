'use client';

import Image from 'next/image';

function TeamScore({ team, score, isWinner }) {
  if (!team) {
    return null;
  }

  return (
    <div
      className={`flex flex-1 items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${
        isWinner ? 'border-anl-gold bg-anl-ink/80 shadow-glow' : 'border-white/10 bg-black/25'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-16 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          {team.flag ? (
            <Image src={team.flag} alt={`${team.name} flag`} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/50">
              {team.shortName || 'TBD'}
            </div>
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-white">{team.name || 'To Be Determined'}</p>
          <p className="text-[0.7rem] uppercase tracking-[0.35em] text-white/40">
            {team.countryName || team.managerName || 'Unknown Federation'}
          </p>
        </div>
      </div>
      <span className="text-3xl font-bold text-white">{typeof score === 'number' ? score : '–'}</span>
    </div>
  );
}

function resolveResolution(resolution) {
  if (resolution === 'extra-time') {
    return 'Finished in Extra Time';
  }
  if (resolution === 'penalties') {
    return 'Decided on Penalties';
  }
  if (resolution === 'simulated') {
    return 'Simulated Result';
  }
  return 'Full Time';
}

export default function MatchDetails({ match }) {
  if (!match) {
    return null;
  }

  const team1 = match.team1 || {};
  const team2 = match.team2 || {};
  const score = match.score || {};
  const goals = Array.isArray(match.goalscorers) ? match.goalscorers : [];
  const resolutionLabel = resolveResolution(match.resolution || match.status);
  const sortedGoals = [...goals].sort((a, b) => {
    const minuteA = typeof a?.minute === 'number' ? a.minute : Number.POSITIVE_INFINITY;
    const minuteB = typeof b?.minute === 'number' ? b.minute : Number.POSITIVE_INFINITY;
    return minuteA - minuteB;
  });

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-anl-ink via-anl-ink/95 to-black pb-24 text-white">
      <section className="border-b border-white/10 bg-anl-ink/90">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">{match.round || 'Knockout Fixture'}</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Match Summary</h1>
          <p className="mt-2 text-sm text-white/70">{resolutionLabel}</p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <TeamScore team={team1} score={score.team1} isWinner={match.winnerId && match.winnerId === team1.id} />
            <TeamScore team={team2} score={score.team2} isWinner={match.winnerId && match.winnerId === team2.id} />
          </div>

          {match.penalties && (
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/50">
              Penalties: {match.penalties.team1} - {match.penalties.team2}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-8 px-6">
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">AI Commentary</h2>
          <blockquote className="rounded-2xl border border-white/10 bg-anl-ink/70 p-5 text-sm text-white/80 whitespace-pre-line">
            {match.commentary || 'No commentary available for this match.'}
          </blockquote>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Key Moments</h2>
          {sortedGoals.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm text-white/80">
                <thead className="bg-black/40 text-xs uppercase tracking-[0.35em] text-white/50">
                  <tr>
                    <th className="px-4 py-3">Minute</th>
                    <th className="px-4 py-3">Scorer</th>
                    <th className="px-4 py-3">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGoals.map((goal, index) => (
                    <tr key={`${goal.scorerName || 'goal'}-${index}`} className={index % 2 === 0 ? 'bg-black/25' : 'bg-black/15'}>
                      <td className="px-4 py-3 text-white/60">
                        {typeof goal?.minute === 'number' ? `${goal.minute}'` : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{goal.scorerName || 'Unknown scorer'}</td>
                      <td className="px-4 py-3 text-white/70">{goal.teamName || goal.teamCountry || 'Unknown team'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/60">
              No key moments were recorded for this match.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
