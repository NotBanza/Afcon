import { notFound } from 'next/navigation';
import TeamHeader from '@/components/analytics/TeamHeader';
import GoalsLineChart from '@/components/analytics/GoalsLineChart';
import WinRatePieChart from '@/components/analytics/WinRatePieChart';
import { getTeamAnalytics } from '@/lib/analyticsService';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function TeamAnalyticsPage({ params }) {
  const teamId = params?.teamId;
  const analytics = await getTeamAnalytics(teamId);

  if (!analytics) {
    notFound();
  }

  const { team, summary, performance, trends } = analytics;

  return (
    <main className="min-h-screen bg-gradient-to-b from-anl-ink via-black to-black pb-24 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <TeamHeader team={team} summary={summary} performance={performance} />

        <section className="grid gap-6 lg:grid-cols-2">
          <GoalsLineChart data={trends.goals} />
          <WinRatePieChart data={trends.winRate} totalMatches={summary.matchesPlayed} />
        </section>

        {trends.rating.length > 0 && (
          <section className="rounded-3xl border border-anl-gold/30 bg-black/40 p-6 text-sm text-white/70">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Average Rating Trend</p>
            <p className="mt-2 max-w-3xl">
              The squad currently holds a rating of <span className="font-semibold text-anl-emerald">{Math.round(team.rating)}</span>.
              Rating analytics will expand once historical rating data is recorded per fixture.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
