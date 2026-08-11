import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// NOTE: This is a lightweight "private beta" gate — the passcode is present
// in the client bundle and trivial to bypass by anyone determined to look.
// Real authentication happens at /login against the backend. Use this only
// to keep casual visitors out of the platform preview.
const PASSCODE = 'azoryfood';
const STORAGE_KEY = 'afood_access_granted_v1';

const Logo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <defs>
      <linearGradient id="gateLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4EECD3" />
        <stop offset="100%" stopColor="#4EEC90" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#gateLogoGrad)" strokeWidth="3" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="url(#gateLogoGrad)" strokeWidth="1.5" opacity="0.5" />
    <path d="M60 130 L100 55 L140 130 L120 130 L100 90 L80 130 Z" fill="url(#gateLogoGrad)" />
    <circle cx="100" cy="135" r="4" fill="#4EECD3" />
  </svg>
);

function AccessGate({ children }) {
  const [granted, setGranted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!granted) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [granted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    // Small delay so the UI feels intentional
    setTimeout(() => {
      if (value.trim().toLowerCase() === PASSCODE) {
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
        setGranted(true);
      } else {
        setError(true);
        setSubmitting(false);
      }
    }, 250);
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {!granted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-base"
            style={{
              backgroundImage:
                'radial-gradient(1200px 800px at 100% -10%, rgba(78,236,211,0.10), transparent 60%), ' +
                'radial-gradient(900px 700px at -10% 110%, rgba(78,236,211,0.06), transparent 60%)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-[92%] max-w-sm p-6 sm:p-8 rounded-2xl bg-brand-surface/90 backdrop-blur-xl border border-brand-border shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(78,236,211,0.06)]"
            >
              <div className="flex flex-col items-center text-center">
                <Logo size={56} />
                <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/25 px-2.5 py-1 mt-5">
                  <Lock className="h-3 w-3 text-brand-accent" />
                  <span className="text-brand-accent text-[10px] font-semibold uppercase tracking-wider">
                    Private Beta
                  </span>
                </div>
                <h1 className="text-brand-primary text-xl sm:text-2xl font-bold tracking-tight mt-3">
                  Afood Lebanon
                </h1>
                <p className="text-brand-secondary text-sm mt-1.5">
                  Enter the access passcode to continue.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <Input
                  type="password"
                  autoFocus
                  placeholder="Passcode"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); if (error) setError(false); }}
                  className={`h-11 text-center tracking-widest ${error ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/20' : ''}`}
                  aria-invalid={error}
                  aria-describedby={error ? 'gate-error' : undefined}
                />
                {error && (
                  <p id="gate-error" className="text-brand-error text-xs text-center">
                    Incorrect passcode. Try again.
                  </p>
                )}
                <Button type="submit" className="w-full h-11" disabled={submitting || !value.trim()}>
                  {submitting ? 'Checking…' : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
                </Button>
              </form>

              <p className="text-brand-muted text-[11px] text-center mt-5">
                Need access? Contact{' '}
                <a href="mailto:hello@afoodlebanon.com" className="text-brand-accent hover:underline">
                  hello@afoodlebanon.com
                </a>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { AccessGate };
export default AccessGate;
