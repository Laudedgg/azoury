import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Truck, ShoppingCart, ShieldCheck, PackageCheck,
  Settings2, ClipboardList, BarChart3, Receipt, User, Store,
  CheckCircle2, Zap, Eye, Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
  viewport: { once: true, margin: '-80px' },
};

// Produce imagery — Unsplash CDN, dark-friendly, high-res
// Brand imagery — drop the PNGs in client/public/brand/ with these names.
const HERO_IMG         = '/brand/hero-produce-command-center.png';
const SUPPLY_CHAIN_IMG = '/brand/supply-chain-map-visual.png';
const AI_DASHBOARD_IMG = '/brand/ai-agent-dashboard-visual.png';
const CRATES_CUTOUT    = '/brand/produce-crates-cutout-alpha.png';

// Fallback Unsplash photos in case a brand PNG hasn't been dropped in yet.
// Each brand <img> is wrapped in an onError swap so the site never shows a
// broken image during rollout.
const HERO_FALLBACK    = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=2200&q=80&auto=format&fit=crop';
const SUPPLY_FALLBACK  = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=2200&q=80&auto=format&fit=crop';
const AI_FALLBACK      = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=2200&q=80&auto=format&fit=crop';
const B2C_IMG          = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=2200&q=80&auto=format&fit=crop';
const CTA_IMG          = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=2200&q=80&auto=format&fit=crop';

const brandOnError = (fallback) => (e) => {
  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
};


const Logo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <defs>
      <linearGradient id="landingLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4EECD3" />
        <stop offset="100%" stopColor="#4EEC90" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#landingLogoGrad)" strokeWidth="3" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="url(#landingLogoGrad)" strokeWidth="1.5" opacity="0.5" />
    <path d="M60 130 L100 55 L140 130 L120 130 L100 90 L80 130 Z" fill="url(#landingLogoGrad)" />
    <circle cx="100" cy="135" r="4" fill="#4EECD3" />
  </svg>
);

const departments = [
  { icon: ShoppingCart,   name: 'Purchasing',        blurb: 'Aggregated buy lists, supplier POs, WhatsApp share' },
  { icon: PackageCheck,   name: 'Receiving',         blurb: 'Match arrivals to POs, flag missing items on the fly' },
  { icon: Settings2,      name: 'Operations',        blurb: 'Dispatch per client, source breakdown, free bonuses' },
  { icon: ShieldCheck,    name: 'Quality Control',   blurb: 'Pre-dispatch checklist, grade verification per line' },
  { icon: Truck,          name: 'Logistics & Fleet', blurb: 'Route planning, truck assignments, odometer tracking' },
  { icon: User,           name: 'Drivers',           blurb: 'Mobile-first delivery capture, refusal reasons, signatures' },
  { icon: Receipt,        name: 'Accounting',        blurb: 'Auto-invoice on delivery, statements, collection tracking' },
  { icon: BarChart3,      name: 'Executive View',    blurb: 'Real-time KPIs across every step of the chain' },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled ? 'bg-brand-base/85 backdrop-blur-md border-b border-brand-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-bold text-brand-primary text-base sm:text-lg tracking-tight">Afood Lebanon</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          <a href="#platform" className="text-sm text-brand-secondary hover:text-brand-accent transition-colors">Platform</a>
          <a href="#departments" className="text-sm text-brand-secondary hover:text-brand-accent transition-colors">Departments</a>
          <a href="#ai" className="text-sm text-brand-secondary hover:text-brand-accent transition-colors">AI Agent</a>
          <a href="#b2c" className="text-sm text-brand-secondary hover:text-brand-accent transition-colors">For Consumers</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Get started <ArrowRight className="w-3.5 h-3.5" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden isolate">
      {/* Brand hero image — warehouse scene at full strength; text legibility
          comes from a focused vignette + a soft dark band behind the copy,
          not a blanket dimmer over the whole photo. */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden
          loading="eager"
          onError={brandOnError(HERO_FALLBACK)}
          className="w-full h-full object-cover object-center scale-110"
        />
        {/* Edge vignette (dark at edges, image stays bright in the middle) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(11,30,30,0.65) 100%)',
          }}
        />
        {/* Horizontal band behind the copy (top→transparent→dark bottom hem) */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-base/70 via-brand-base/15 to-brand-base/80" />
      </div>

      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #4EECD3 0%, transparent 60%)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #4EEC90 0%, transparent 60%)' }}
        />
      </div>



      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 border border-brand-accent/25 px-3 py-1.5 mb-6"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-brand-accent text-xs font-semibold uppercase tracking-wider">
            End-to-end supply chain, live in Lebanon
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-brand-primary tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Your command center for{' '}
          <span className="bg-gradient-to-r from-brand-accent to-brand-success bg-clip-text text-transparent">
            fresh produce
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-base sm:text-lg lg:text-xl text-brand-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Afood Lebanon tracks every step of the fruits & vegetables supply chain — from farmgate purchase to
          the restaurant door — with department-specific tools and an AI agent working alongside your team.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="w-full sm:w-auto min-w-[180px]">
            <Link to="/register">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-w-[180px]">
            <Link to="/login">Sign in to your account</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-xs text-brand-muted"
        >
          Trusted by suppliers, distributors, and restaurants across Beirut.
        </motion.p>
      </div>
    </section>
  );
}

function Platform() {
  // Each pillar attaches to a stage on the supply-chain image. The %
  // coordinates were tuned to sit above the farm / QC / truck illustrations
  // in supply-chain-map-visual.png.
  const pillars = [
    {
      icon: Eye,
      title: 'Full-chain visibility',
      body: 'From the farmgate to the last delivery signature — every quantity, price, and quality grade tracked in one place.',
      pos: { top: '8%', left: '2%' },        // above the farm
      align: 'left',
    },
    {
      icon: Cpu,
      title: 'Department-first design',
      body: 'Purchasing, receiving, ops, QC, logistics, drivers, accounting — each team lands in a workspace built for their exact job.',
      pos: { top: '8%', left: '50%', transform: 'translateX(-50%)' }, // above the QC step
      align: 'center',
    },
    {
      icon: Sparkles,
      title: 'AI agent, on every layer',
      body: 'A copilot that watches inventory, flags mismatches, drafts buy lists, and turns delivery photos into structured records.',
      pos: { top: '8%', right: '2%' },       // above the truck / destination
      align: 'right',
    },
  ];

  return (
    <section id="platform" className="py-20 sm:py-28 border-t border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-wider mb-3">The platform</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-primary tracking-tight leading-tight">
            One platform. Every step. Every team.
          </h2>
          <p className="mt-4 text-brand-secondary text-base sm:text-lg">
            Built specifically for the mess of fresh produce — variable weights, quality grades,
            free bonuses, last-minute substitutions, and clients that need to know exactly what's coming.
          </p>
        </motion.div>

        {/* Supply chain map visual with pillar callouts overlaid — desktop.
            Mobile falls back to a clean stacked list of pillars beneath the
            image so the callouts stay readable. */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="mt-14 relative rounded-2xl border border-brand-border bg-brand-surface/40 overflow-hidden"
        >
          <div className="relative">
            <img
              src={SUPPLY_CHAIN_IMG}
              alt="Afood Lebanon supply chain: from farm to receiving to QC to delivery"
              loading="lazy"
              onError={brandOnError(SUPPLY_FALLBACK)}
              className="w-full h-auto block"
            />
            {/* Soft dim so callout cards read cleanly over the illustration */}
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-b from-brand-base/60 via-brand-base/10 to-transparent pointer-events-none" />

            {/* Overlay pillar callouts (desktop only) */}
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                style={p.pos}
                className={`hidden lg:block absolute w-[280px] xl:w-[300px] rounded-2xl bg-brand-base/85 backdrop-blur-md border border-brand-accent/25 p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center">
                    <p.icon className="h-4 w-4 text-brand-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-brand-primary font-semibold text-sm leading-tight">{p.title}</p>
                    <p className="text-brand-secondary text-xs leading-relaxed mt-1.5">{p.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile pillars stack below (desktop callouts already sit on the image) */}
          <div className="lg:hidden divide-y divide-brand-border/60 border-t border-brand-border/60">
            {pillars.map((p) => (
              <div key={p.title} className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                  <p.icon className="h-4 w-4 text-brand-accent" />
                </div>
                <div>
                  <p className="text-brand-primary font-semibold text-sm">{p.title}</p>
                  <p className="text-brand-secondary text-xs leading-relaxed mt-1">{p.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Caption strip */}
          <div className="px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-border/60 bg-brand-surface/60">
            <p className="text-brand-secondary text-xs sm:text-sm">
              <b className="text-brand-primary">Farm → Receiving → QC → Cold-chain → Kitchen door.</b>
              {' '}Every crate audited, every hand-off logged.
            </p>
            <a href="#departments" className="text-brand-accent text-xs font-semibold uppercase tracking-wider hover:text-brand-accent-hover">
              See every step →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Departments() {
  return (
    <section id="departments" className="py-20 sm:py-28 border-t border-brand-border/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-wider mb-3">Every role, its own space</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-primary tracking-tight leading-tight">
            A workspace built for each department
          </h2>
          <p className="mt-4 text-brand-secondary text-base sm:text-lg">
            No generic dashboards. Each team member logs in and lands where they need to be.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {departments.map((d, i) => (
            <motion.div
              key={d.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 4) * 0.06 }}
              className="group relative rounded-xl border border-brand-border bg-brand-surface/60 p-4 sm:p-5 hover:border-brand-accent/40 hover:bg-brand-surface transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-8 w-8 rounded-lg bg-brand-elevated flex items-center justify-center shrink-0 group-hover:bg-brand-accent/10 transition-colors">
                  <d.icon className="h-4 w-4 text-brand-accent" />
                </div>
                <span className="text-brand-primary font-semibold text-sm">{d.name}</span>
              </div>
              <p className="text-brand-muted text-xs leading-relaxed">{d.blurb}</p>
            </motion.div>
          ))}
        </div>

        {/* AI copilot — a subsection of the departments story ("and there's
            an AI sitting inside every one of these workspaces"). Two-column
            with the dashboard visual on the right. */}
        <motion.div
          id="ai"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-brand-border/60"
        >
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 border border-brand-accent/25 px-3 py-1 mb-4">
                <Sparkles className="h-3 w-3 text-brand-accent" />
                <span className="text-brand-accent text-[11px] font-semibold uppercase tracking-wider">
                  + AI copilot on every screen
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-primary tracking-tight leading-tight">
                Every one of those workspaces has an AI beside it
              </h3>
              <p className="mt-3 text-brand-secondary text-sm sm:text-base leading-relaxed">
                The copilot reads your inventory, watches client patterns, flags weight anomalies,
                drafts buy lists, and answers questions across departments in real time — so the team
                spends less time in spreadsheets and more time moving crates.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  'Auto-drafts tomorrow\'s buy list from open orders + stock',
                  'Detects grade mismatches during receiving',
                  'Suggests substitutions when a supplier runs short',
                  'Turns handwritten delivery notes into structured records',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-brand-primary">
                    <CheckCircle2 className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brand AI dashboard visual */}
            <div className="relative rounded-2xl border border-brand-border bg-brand-surface overflow-hidden shadow-2xl shadow-brand-accent/10">
              <img
                src={AI_DASHBOARD_IMG}
                alt="Afood AI copilot dashboard showing live inventory + recommendations"
                loading="lazy"
                onError={brandOnError(AI_FALLBACK)}
                className="w-full h-auto block"
              />
              <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-brand-base/85 backdrop-blur-sm border border-brand-success/30 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-success animate-pulse" />
                <span className="text-brand-success text-[10px] font-semibold uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ClientPortals() {
  return (
    <section className="py-20 sm:py-28 border-t border-brand-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        {/* Portal illustration */}
        <motion.div {...fadeUp} className="lg:order-2">
          <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-brand-border/60 bg-brand-elevated/40">
              <div className="h-2.5 w-2.5 rounded-full bg-brand-error/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-brand-warning/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-brand-success/60" />
              <span className="ml-3 text-[10px] text-brand-muted mono">portal.afoodlebanon.com/orders</span>
            </div>
            <div className="p-5">
              <p className="text-brand-secondary text-xs uppercase tracking-wider mb-1">Welcome, Al-Ballouta Kitchen</p>
              <p className="text-brand-primary text-2xl font-bold mono">$3,240<span className="text-brand-muted text-sm font-medium ml-2">this month</span></p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-brand-border bg-brand-base p-3">
                  <p className="text-brand-muted text-[10px] uppercase tracking-wider">Active Orders</p>
                  <p className="text-brand-primary font-semibold text-lg mono">4</p>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-base p-3">
                  <p className="text-brand-muted text-[10px] uppercase tracking-wider">Next Delivery</p>
                  <p className="text-brand-primary font-semibold text-sm">Tomorrow · 6am</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-brand-accent/20 bg-brand-accent/5 p-3 text-xs text-brand-accent">
                Your Tuesday order is being prepared — 12 items, dispatch confirmed.
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="lg:order-1">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-wider mb-3">Client-specific portals</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-primary tracking-tight leading-tight">
            Every client gets their own window into the chain
          </h2>
          <p className="mt-4 text-brand-secondary text-base sm:text-lg">
            Restaurants, hotels, and retailers each get a dedicated portal — place orders, track deliveries,
            view invoices, and see exactly what was in every crate.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Place orders with any device, any time',
              'Live delivery status and driver location',
              'Statements of account, real-time collections',
              'Multiple sub-users per business, with role-based access',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-brand-primary">
                <CheckCircle2 className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function ConsumerSection() {
  return (
    <section id="b2c" className="py-24 sm:py-32 border-t border-brand-border/60 relative overflow-hidden isolate">
      {/* Subtle produce backdrop with heavy dark overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={B2C_IMG}
          alt=""
          aria-hidden
          loading="lazy"
          className="w-full h-full object-cover object-center scale-105 opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-base/90 via-brand-base/75 to-brand-base/95" />
      </div>
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-40">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(78,236,144,0.20) 0%, transparent 60%)' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left column: text + CTA */}
          <div>
            <motion.div {...fadeUp} className="inline-flex items-center gap-2 rounded-full bg-brand-success/10 border border-brand-success/25 px-3 py-1 mb-5">
              <Store className="h-3 w-3 text-brand-success" />
              <span className="text-brand-success text-[11px] font-semibold uppercase tracking-wider">Coming soon</span>
            </motion.div>

            <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-primary tracking-tight leading-tight">
              Fresh produce, straight to your door.
            </motion.h2>
            <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-5 text-brand-secondary text-base sm:text-lg">
              We're bringing the same supply-chain rigor that serves top Beirut restaurants directly to Lebanese
              households. Same-day delivery, transparent pricing, real quality grades. Launching later this year.
            </motion.p>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-8">
              <a
                href="mailto:hello@afoodlebanon.com?subject=Waitlist%20me%20for%20Afood%20B2C"
                className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 border border-brand-accent/25 hover:bg-brand-accent/15 px-4 py-2.5 text-sm text-brand-accent font-medium transition-colors"
              >
                Join the consumer waitlist <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          </div>

          {/* Right column: produce-crates cutout as the section's hero prop */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="relative">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(78,236,144,0.18), transparent 65%)',
                filter: 'blur(20px)',
              }}
            />
            <img
              src={CRATES_CUTOUT}
              alt="Boxes of fresh produce ready for delivery — lettuce, tomatoes, herbs, eggplant, carrots, lemons"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="w-full h-auto max-w-[560px] mx-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 sm:py-32 border-t border-brand-border/60 relative overflow-hidden isolate">
      {/* Subtle produce backdrop for warm close */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={CTA_IMG}
          alt=""
          aria-hidden
          loading="lazy"
          className="w-full h-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-base via-brand-base/70 to-brand-base" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-primary tracking-tight">
          Ready to see the full chain?
        </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="mt-4 text-brand-secondary text-base sm:text-lg">
          Create an account for your business, or sign in if you already have one.
        </motion.p>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px]">
            <Link to="/register">
              Create your account <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-w-[200px]">
            <Link to="/login">Sign in</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-brand-border/60 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <span className="text-brand-primary text-sm font-semibold">Afood Lebanon</span>
        </div>
        <p className="text-brand-muted text-xs">
          © {new Date().getFullYear()} Afood Lebanon. Made in Beirut.
        </p>
        <div className="flex items-center gap-5">
          <Link to="/login" className="text-brand-muted hover:text-brand-accent text-xs transition-colors">Sign in</Link>
          <Link to="/register" className="text-brand-muted hover:text-brand-accent text-xs transition-colors">Register</Link>
          <a href="mailto:hello@afoodlebanon.com" className="text-brand-muted hover:text-brand-accent text-xs transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-brand-base text-brand-primary">
      <Nav />
      <Hero />
      <Platform />
      <Departments />
      <ClientPortals />
      <ConsumerSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export { Landing };
export default Landing;
