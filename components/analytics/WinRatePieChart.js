'use client';

import { motion } from 'framer-motion';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay: 0.1 } },
};

const SEGMENT_COLORS = {
  Wins: '#0BAF82',
  Draws: '#E5C66B',
  Losses: '#D1495B',
};

function WinTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const datum = payload[0].payload;

  return (
    <div className="rounded-xl border border-anl-gold/60 bg-anl-ink/95 px-4 py-3 text-xs text-white shadow-lg">
      <p className="font-semibold" style={{ color: SEGMENT_COLORS[datum.name] }}>{datum.name}</p>
      <p className="mt-1">Matches: {datum.value}</p>
      {typeof datum.percentage === 'number' && (
        <p className="mt-1 text-white/60">{datum.percentage.toFixed(1)}%</p>
      )}
    </div>
  );
}

export default function WinRatePieChart({ data = [], totalMatches = 0 }) {
  const enriched = data.map((datum) => ({
    ...datum,
    percentage: totalMatches ? (datum.value / totalMatches) * 100 : 0,
  }));

  const hasResults = enriched.some((datum) => datum.value > 0);

  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col rounded-3xl border border-anl-gold/40 bg-black/40 p-6 text-white shadow-xl"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Win Rate</p>
        <h2 className="mt-2 text-xl font-semibold">Result Breakdown</h2>
      </div>

      {!hasResults ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-anl-ink/70 text-sm text-white/50">
          No completed matches yet to calculate win rate.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enriched}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
              >
                {enriched.map((entry) => (
                  <Cell key={entry.name} fill={SEGMENT_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip content={<WinTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.35em] text-white/50">
        {enriched.map((entry) => (
          <span key={entry.name} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-6 rounded-full"
              style={{ backgroundColor: SEGMENT_COLORS[entry.name] || '#8884d8' }}
            />
            {entry.name}
          </span>
        ))}
      </div>
    </motion.section>
  );
}
