'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import countries from '@/data/countries.json';
import Step1Federation from '@/components/register/Step1Federation';
import Step2Squad from '@/components/register/Step2Squad';
import Step3Review from '@/components/register/Step3Review';
import useTeamRating from '@/hooks/useTeamRating';
import { createTeam } from '@/services/teamService';

const STEPS = [
  { key: 'federation', label: 'Federation' },
  { key: 'squad', label: 'Squad' },
  { key: 'review', label: 'Review' },
];

const stepVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
};

const initialFederation = {
  federationName: '',
  managerName: '',
  email: '',
  countryCode: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [federation, setFederation] = useState(initialFederation);
  const [players, setPlayers] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimer = useRef(null);
  const { average } = useTeamRating(players);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === federation.countryCode),
    [federation.countryCode],
  );

  const updateFederation = (changes) => {
    setFederation((prev) => ({ ...prev, ...changes }));
  };

  const showToast = (message) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3200);
  };

  const validateStepOne = () => {
    const nextErrors = {};
    if (!federation.federationName.trim()) {
      nextErrors.federationName = 'Federation name is required.';
    }
    if (!federation.managerName.trim()) {
      nextErrors.managerName = 'Manager name is required.';
    }
    if (!federation.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(federation.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!federation.countryCode) {
      nextErrors.countryCode = 'Country selection is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepTwo = () => {
    const messages = [];
    if (players.length !== 23) {
      messages.push('You must register exactly 23 players.');
    }
    const gkCount = players.filter((player) => player.naturalPosition === 'GK').length;
    if (gkCount < 1) {
      messages.push('Include at least one goalkeeper in your squad.');
    }
    const captainCount = players.filter((player) => player.isCaptain).length;
    if (captainCount !== 1) {
      messages.push('Assign exactly one captain.');
    }
    const missingNames = players.some((player) => !player.name || !player.name.trim());
    if (missingNames) {
      messages.push('All players require a name.');
    }

    const nextErrors = messages.length ? { players: messages[0] } : {};
    setErrors(nextErrors);
    return messages.length === 0;
  };

  const handleNext = () => {
    if (stepIndex === 0 && !validateStepOne()) {
      return;
    }
    if (stepIndex === 1 && !validateStepTwo()) {
      return;
    }
    setErrors({});
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!selectedCountry) {
      setSubmitError('Select a country before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      federationName: federation.federationName,
      managerName: federation.managerName,
      email: federation.email,
      country: selectedCountry,
      players,
      rating: average,
    };

    try {
      await createTeam(payload);
      showToast('Team Registered!');
      setTimeout(() => {
        router.push('/bracket');
      }, 600);
    } catch (error) {
      console.error('Failed to create team', error);
      setSubmitError('Something went wrong while registering the team. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-anl-ink/70 p-6 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-center gap-4">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepIndex === index;
            const isCompleted = stepIndex > index;
            return (
              <div key={step.key} className="flex flex-1 items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isActive
                      ? 'border-anl-gold bg-anl-gold text-anl-ink shadow-glow'
                      : isCompleted
                      ? 'border-anl-gold/60 bg-anl-gold/20 text-anl-gold'
                      : 'border-white/20 bg-white/10 text-white/60'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <div className="flex-1 text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                  {step.label}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 rounded-full transition ${
                      stepIndex > index ? 'bg-anl-gold' : 'bg-white/15'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="rounded-3xl border border-white/10 bg-black/30 p-8 shadow-inner"
            >
              {stepIndex === 0 && (
                <Step1Federation
                  values={federation}
                  onChange={updateFederation}
                  countries={countries}
                  errors={errors}
                />
              )}
              {stepIndex === 1 && (
                <Step2Squad
                  players={players}
                  setPlayers={setPlayers}
                  errors={errors}
                  onAutofill={() => setErrors({})}
                />
              )}
              {stepIndex === 2 && selectedCountry && (
                <Step3Review
                  federation={federation}
                  country={selectedCountry}
                  players={players}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  error={submitError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0 || submitting}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-anl-gold/70 hover:text-anl-gold/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          {stepIndex < STEPS.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-anl-gold bg-anl-emerald px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Next
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 right-10 z-50 rounded-2xl border border-anl-gold bg-anl-ink/95 px-5 py-4 text-sm font-semibold text-white shadow-glow"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
