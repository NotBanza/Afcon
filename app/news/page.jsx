'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { motion } from 'framer-motion';
import NewsCard from '@/components/news/NewsCard';
import { db } from '@/lib/firebase';

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const FILTER_TAGS = ['All', 'Match', 'Player', 'Federation'];

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ tag: 'All', language: 'All' });
  const [shouldPoll, setShouldPoll] = useState(false);

  const fetchLatestNews = useCallback(async () => {
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('Request failed');
      }
      const payload = await response.json();
      const items = Array.isArray(payload.articles)
        ? payload.articles.map((article) => ({
            ...article,
            createdAtLabel: typeof article.createdAtMs === 'number'
              ? new Date(article.createdAtMs).toLocaleString()
              : article.createdAtIso
                ? new Date(article.createdAtIso).toLocaleString()
                : 'Just now',
          }))
        : [];
      setArticles(items);
      setError(null);
    } catch (err) {
      console.error('News API fetch error:', err);
      setError('Unable to load news at the moment.');
    }
  }, []);

  useEffect(() => {
    if (!db) {
      setShouldPoll(true);
      return () => {};
    }

    const collectionRef = collection(db, 'news');
    const newsQuery = query(collectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        setError(null);
        setShouldPoll(false);
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          const createdAtDate = data.createdAt?.toDate?.();
          return {
            id: doc.id,
            ...data,
            createdAtLabel: createdAtDate ? createdAtDate.toLocaleString() : 'Just now',
          };
        });
        setArticles(items);
      },
      (err) => {
        console.error('News listener error:', err);
        setShouldPoll(true);
        if (err?.code === 'permission-denied') {
          setError('Live news requires elevated permissions. Showing latest updates instead.');
          fetchLatestNews();
        } else {
          setError('Unable to load news at the moment.');
        }
      },
    );

    return () => unsubscribe();
  }, [fetchLatestNews]);

  useEffect(() => {
    if (!shouldPoll) {
      return () => {};
    }

    fetchLatestNews();
    const interval = setInterval(fetchLatestNews, 60000);
    return () => clearInterval(interval);
  }, [shouldPoll, fetchLatestNews]);

  const languages = useMemo(() => {
    const langs = new Set(['All']);
    articles.forEach((article) => {
      if (article.language) {
        langs.add(article.language.toLowerCase());
      }
    });
    return Array.from(langs);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const tagMatch = filters.tag === 'All' || article.tag === filters.tag;
      const languageMatch = filters.language === 'All' || article.language?.toLowerCase() === filters.language.toLowerCase();
      return tagMatch && languageMatch;
    });
  }, [articles, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-anl-ink via-black to-black pb-24 text-white">
      <motion.section
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="border-b border-white/10 bg-anl-ink/90 py-16"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-anl-gold">Inside The ANL</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">News & Interviews</h1>
            <p className="mt-4 max-w-3xl text-sm text-white/70">
              Follow every knockout twist with instant recaps, locker-room quotes, and federation storylines generated moments after the final whistle.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
              {FILTER_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleFilterChange('tag', tag)}
                  className={`rounded-full border px-3 py-1 transition ${
                    filters.tag === tag ? 'border-anl-gold bg-anl-gold/20 text-anl-gold' : 'border-white/15 hover:border-anl-gold hover:text-anl-gold'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
              <span>Language</span>
              <select
                value={filters.language}
                onChange={(event) => handleFilterChange('language', event.target.value)}
                className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-white/80 focus:border-anl-gold focus:outline-none"
              >
                {languages.map((language) => (
                  <option key={language} value={language} className="text-black">
                    {language.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="mx-auto mt-10 w-full max-w-5xl px-6">
        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {filteredArticles.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center text-sm text-white/60">
            No news updates just yet. Simulate a match to generate fresh headlines.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
