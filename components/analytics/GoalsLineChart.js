'use client';

import { motion } from 'framer-motion';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function GoalsTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const datum = payload[0].payload;

  return (
    <div className="rounded-xl border border-anl-gold/60 bg-anl-ink/95 px-4 py-3 text-xs text-white shadow-lg">
      <p className="font-semibold text-anl-gold">Match {label}</p>
      <p className="mt-1">Goals scored: {datum.goals}</p>
      {datum.opponent && <p className="mt-1 text-white/60">vs {datum.opponent}</p>}
      {datum.date && (
        <p className="mt-1 text-white/40">{new Date(datum.date).toLocaleDateString()}</p>
      )}
    </div>
  );
}

export default function GoalsLineChart({ data = [] }) {
  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col rounded-3xl border border-anl-gold/40 bg-black/40 p-6 text-white shadow-xl"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Goal Trend</p>
        <h2 className="mt-2 text-xl font-semibold">Goals per Match</h2>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-anl-ink/70 text-sm text-white/50">
          No completed matches yet. Come back after the first whistle.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="6 8" />
              <XAxis
                dataKey="matchNumber"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                label={{ value: 'Match', position: 'insideBottom', dy: 10, fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                label={{ value: 'Goals', angle: -90, position: 'insideLeft', dx: -10, fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              />
              <Tooltip content={<GoalsTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
              <Line type="monotone" dataKey="goals" stroke="#E5C66B" strokeWidth={3} dot={{ stroke: '#E5C66B', fill: '#0B2C2A', r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.section>
  );
}
