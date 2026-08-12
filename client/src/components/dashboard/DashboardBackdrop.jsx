import React from 'react';

// Atmospheric backdrop for the executive dashboard: three softly-animated
// radial-gradient orbs + a faint dot pattern for texture. Fixed to the
// dashboard section (absolute inset-0), sits at z-0 with content on top.
function DashboardBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Faint dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #4EECD3 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient gradient orbs */}
      <div
        className="absolute -top-24 -left-32 w-[520px] h-[520px] rounded-full opacity-30 animate-pulse-glow"
        style={{
          background:
            'radial-gradient(circle, rgba(78,236,211,0.35) 0%, transparent 65%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full opacity-25 animate-pulse-glow"
        style={{
          background:
            'radial-gradient(circle, rgba(78,236,144,0.30) 0%, transparent 65%)',
          filter: 'blur(20px)',
          animationDelay: '1.5s',
        }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[560px] h-[560px] rounded-full opacity-15 animate-pulse-glow"
        style={{
          background:
            'radial-gradient(circle, rgba(78,184,236,0.25) 0%, transparent 65%)',
          filter: 'blur(20px)',
          animationDelay: '3s',
        }}
      />

      {/* Top vignette so header area stays crisp */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-base to-transparent" />
    </div>
  );
}

export { DashboardBackdrop };
export default DashboardBackdrop;
