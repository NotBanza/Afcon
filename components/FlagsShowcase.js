'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

const BASE_URL = 'https://restcountries.com/v3.1';
const HIGHLIGHT_CODES = ['NG', 'MA', 'EG', 'ZA', 'GH'];

async function fetchFlags(codes) {
  const response = await fetch(`${BASE_URL}/alpha?codes=${codes.join(',')}&fields=name,flags,cca2`);
  if (!response.ok) {
    throw new Error('Failed to load flag showcase');
  }
  const payload = await response.json();
  return Array.isArray(payload)
    ? payload
        .map((entry) => ({
          code: entry.cca2,
          name: entry.name?.common || entry.name?.official || entry.cca2,
          flagUrl: entry.flags?.svg || entry.flags?.png,
          flagAlt: entry.flags?.alt || `${entry.name?.common || entry.cca2} flag`,
        }))
        .filter((item) => item.flagUrl)
    : [];
}

function FlagTile({ flag }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-anl-ink/70 px-6 py-6 text-center shadow-lg">
      <div className="relative h-20 w-32 overflow-hidden rounded-2xl border border-white/15">
        <Image src={flag.flagUrl} alt={flag.flagAlt} fill sizes="150px" className="object-cover" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">{flag.name}</p>
    </div>
  );
}

export default function FlagsShowcase() {
  const [flags, setFlags] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchFlags(HIGHLIGHT_CODES);
        if (active) {
          setFlags(data);
        }
      } catch (err) {
        console.error('Failed to load flag showcase', err);
        if (active) {
          setError('Unable to load featured flags.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const content = useMemo(() => {
    if (error) {
      return <p className="text-sm text-red-200/80">{error}</p>;
    }
    if (!flags.length) {
      return <p className="text-sm text-white/60">Loading continental colours…</p>;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {flags.map((flag) => (
          <FlagTile key={flag.code} flag={flag} />
        ))}
      </div>
    );
  }, [flags, error]);

  return (
    <section className="mt-20">
      <div className="rounded-3xl border border-white/10 bg-anl-ink/70 p-8 shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Nations in the mix</p>
        <h3 className="mt-2 text-3xl font-semibold text-white">Flags across the continent</h3>
        <p className="mt-3 text-sm text-white/60">
          Updated directly from the Rest Countries API, ensuring every federation we showcase carries its authentic colours.
        </p>
        <div className="mt-8">{content}</div>
      </div>
    </section>
  );
}
