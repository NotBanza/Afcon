'use client';

import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const TAG_STYLES = {
  Match: 'border-anl-gold/60 bg-anl-gold/15 text-anl-gold',
  Player: 'border-anl-emerald/60 bg-anl-emerald/15 text-anl-emerald',
  Federation: 'border-anl-scarlet/60 bg-anl-scarlet/15 text-anl-scarlet',
};

export default function NewsCard({ article }) {
  const createdAtLabel = article.createdAtLabel
    || (typeof article.createdAtMs === 'number'
      ? new Date(article.createdAtMs).toLocaleString()
      : article.createdAt?.toDate?.()?.toLocaleString?.() ?? 'Just now');
  const tagStyle = TAG_STYLES[article.tag] || 'border-white/10 bg-white/5 text-white/70';

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-black/45 p-6 text-white shadow-xl"
    >
      <div>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
          <span className={`rounded-full border px-3 py-1 text-[0.65rem] ${tagStyle}`}>{article.tag}</span>
          {article.language && <span className="text-white/40">{article.language.toUpperCase()}</span>}
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-white">{article.title}</h3>
        <p className="mt-3 text-sm text-white/70">{article.summary}</p>
      </div>
      <div className="mt-6 text-xs text-white/40">
        <p>{article.body}</p>
        <p className="mt-4">Published: {createdAtLabel}</p>
      </div>
    </motion.article>
  );
}
