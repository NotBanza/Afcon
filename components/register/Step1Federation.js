'use client';

import Image from 'next/image';

export default function Step1Federation({ values, onChange, countries, errors }) {
  const selectedCountry = countries.find((country) => country.code === values.countryCode);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Federation Details</h2>
        <p className="mt-2 text-sm text-white/65">Introduce your federation before assembling your squad.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="federationName">
            Federation Name
          </label>
          <input
            id="federationName"
            value={values.federationName}
            onChange={(event) => onChange({ federationName: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-anl-gold"
            placeholder="e.g. Ghana Black Stars"
          />
          {errors?.federationName && <p className="text-xs text-red-300">{errors.federationName}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="managerName">
            Manager Name
          </label>
          <input
            id="managerName"
            value={values.managerName}
            onChange={(event) => onChange({ managerName: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-anl-gold"
            placeholder="Head coach"
          />
          {errors?.managerName && <p className="text-xs text-red-300">{errors.managerName}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="email">
            Contact Email
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => onChange({ email: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-anl-gold"
            placeholder="manager@federation.africa"
          />
          {errors?.email && <p className="text-xs text-red-300">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="country">
            Country
          </label>
          <div className="relative">
            <select
              id="country"
              value={values.countryCode}
              onChange={(event) => onChange({ countryCode: event.target.value })}
              className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-anl-gold"
            >
              <option value="" disabled>
                Select country
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code} className="bg-anl-ink text-white">
                  {country.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50">▾</span>
          </div>
          {errors?.countryCode && <p className="text-xs text-red-300">{errors.countryCode}</p>}
          {selectedCountry && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <div className="relative h-6 w-10 overflow-hidden rounded">
                <Image src={selectedCountry.flag} alt="Country flag" fill sizes="40px" className="object-cover" />
              </div>
              <span>{selectedCountry.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
