'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

const BASE_URL = 'https://restcountries.com/v3.1';
const AFRICAN_CODES = ['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CD','CG','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'];

async function fetchFlagsForCodes(codes) {
  const param = codes.join(',');
  const response = await fetch(`${BASE_URL}/alpha?codes=${param}&fields=name,cca2,flags`);
  if (!response.ok) {
    throw new Error('Failed to load flags dataset');
  }
  const payload = await response.json();
  return Array.isArray(payload)
    ? payload
        .map((item) => ({
          code: item.cca2,
          name: item.name?.common || item.name?.official || item.cca2,
          flagUrl: item.flags?.svg || item.flags?.png,
          flagAlt: item.flags?.alt || `${item.name?.common || item.cca2} flag`,
        }))
        .filter((item) => item.flagUrl)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
}

function FlagCard({ flag }) {
  return (
    <div className="flex min-w-[160px] flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center shadow-lg shadow-black/40">
      <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-white/10">
        <Image src={flag.flagUrl} alt={flag.flagAlt} fill sizes="96px" className="object-cover" priority={false} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{flag.name}</p>
    </div>
  );
}

export default function FlagMarquee() {
  const [flags, setFlags] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await fetchFlagsForCodes(AFRICAN_CODES);
        if (isMounted) {
          setFlags(data);
        }
      } catch (err) {
        console.error('Failed to load marquee flags:', err);
        if (isMounted) {
          setError('Unable to load flags right now.');
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const marqueeFlags = useMemo(() => {
    if (!flags.length) {
      return [];
    }
    return [...flags, ...flags];
  }, [flags]);

  return (
    <section className="mt-16">
      <div className="rounded-3xl border border-white/10 bg-anl-ink/70 p-6 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-anl-gold">Nations in the mix</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Flags across the continent</h3>
          </div>
        </div>
        {error && (
          <p className="mt-6 rounded-2xl border border-red-400/30 bg-red-900/20 px-4 py-3 text-sm text-red-200/80">
            {error}
          </p>
        )}
        {!error && !flags.length && (
          <p className="mt-6 text-sm text-white/60">Loading the continent&apos;s colours…</p>
        )}
        {!error && flags.length > 0 && (
          <div className="flag-marquee mt-8">
            <div className="flag-marquee-track">
              {marqueeFlags.map((flag, index) => (
                <FlagCard key={`${flag.code}-${index}`} flag={flag} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
