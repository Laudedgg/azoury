import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-base px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <svg width="80" height="80" viewBox="0 0 200 200" className="mx-auto mb-8">
          <defs>
            <linearGradient id="nfLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4EECD3" />
              <stop offset="100%" stopColor="#4EEC90" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="85" fill="none" stroke="url(#nfLogoGrad)" strokeWidth="3" opacity="0.5" />
          <path d="M60 130 L100 55 L140 130 L120 130 L100 90 L80 130 Z" fill="url(#nfLogoGrad)" />
          <circle cx="100" cy="135" r="4" fill="#4EECD3" />
        </svg>

        <h1 className="text-8xl font-black text-brand-accent mb-4">404</h1>
        <h2 className="text-2xl font-bold text-brand-primary mb-2">Page Not Found</h2>
        <p className="text-brand-secondary mb-8 max-w-md">
          The page you are looking for does not exist or has been moved. Please check the URL or navigate back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button asChild>
            <Link to="/admin">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export { NotFound };
export default NotFound;
