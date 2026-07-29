import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Zap, Shield, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const features = [
  { icon: Zap, text: 'Real-time order tracking and dispatch management' },
  { icon: Shield, text: 'Quality control with weight verification and grading' },
  { icon: BarChart3, text: 'Advanced analytics and supplier performance insights' },
];

const heroImages = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=1920&q=80&auto=format&fit=crop',
];

const Logo = ({ size = 200, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4EECD3" />
        <stop offset="100%" stopColor="#4EEC90" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#logoGrad)" strokeWidth="3" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.5" />
    <path d="M60 130 L100 55 L140 130 L120 130 L100 90 L80 130 Z" fill="url(#logoGrad)" />
    <circle cx="100" cy="135" r="4" fill="#4EECD3" />
  </svg>
);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    heroImages.forEach((src) => { const img = new Image(); img.src = src; });
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 7000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome back!');
      if (data.user?.mustChangePassword) {
        navigate('/change-password');
        return;
      }
      const role = data.user?.role;
      if (['CLIENT_ADMIN', 'CLIENT_STAFF', 'CLIENT_ORDERER', 'CLIENT_RECEIVER'].includes(role)) {
        navigate('/portal');
      } else if (role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate(from);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-brand-base">
      {/* Full-page hero image cross-fade */}
      <div className="fixed inset-0 z-0">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity ease-in-out"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIdx ? 1 : 0,
              transitionDuration: '1800ms',
            }}
          />
        ))}
      </div>

      {/* Dark readability overlay spanning the whole page */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-brand-base/90 via-brand-base/80 to-brand-base/95" />

      {/* Brand color mesh accents */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none mix-blend-screen">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08] animate-mesh-move" style={{ background: 'radial-gradient(circle, #4EECD3 0%, transparent 70%)', top: '-10%', left: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] animate-mesh-move-reverse" style={{ background: 'radial-gradient(circle, #4EEC90 0%, transparent 70%)', bottom: '-15%', right: '-5%', animationDelay: '2s' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] animate-mesh-move" style={{ background: 'radial-gradient(circle, #4EB8EC 0%, transparent 70%)', top: '40%', left: '50%', animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Desktop Left Panel — transparent, sits over the shared background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center px-16"
        >
          <div className="text-center max-w-lg drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Logo size={200} className="mx-auto mb-8" />
            </motion.div>

            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-4xl font-bold text-white tracking-tight mb-2">
              Afood Lebanon
            </motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-brand-accent text-lg font-medium mb-12">
              End-to-End Supply Chain Intelligence
            </motion.p>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4 text-left bg-brand-base/40 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-brand-accent" />
                  </div>
                  <p className="text-white/90 text-sm">{f.text}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile Brand Header — transparent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden"
        >
          <div className="flex flex-col items-center pt-10 pb-6 px-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Logo size={80} className="mb-4" />
            </motion.div>
            <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} className="text-2xl font-bold text-white tracking-tight">
              Afood Lebanon
            </motion.h1>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }} className="text-brand-accent text-xs font-medium mt-1">
              End-to-End Supply Chain Intelligence
            </motion.p>
          </div>
        </motion.div>

        {/* Form Panel — glass card over the shared background */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex-1 flex items-start lg:items-center justify-center px-5 py-8 sm:px-8 lg:p-12"
        >
          <div className="w-full max-w-md bg-brand-surface/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(78,236,211,0.06)] p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-brand-accent text-[11px] font-semibold uppercase tracking-wider">Secure Sign-In</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-1 tracking-tight">Welcome back</h2>
            <p className="text-brand-secondary text-sm mb-6 sm:mb-8">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <Label className="block mb-1.5 sm:mb-2 text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>

              <div>
                <Label className="block mb-1.5 sm:mb-2 text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary transition-colors p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-brand-accent hover:text-brand-accent/80 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? 'Signing In...' : 'Sign In'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <p className="text-brand-muted text-sm text-center mt-6">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-brand-accent hover:underline font-medium">Register</Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes mesh-move { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        @keyframes mesh-move-reverse { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-40px, 30px) scale(0.95); } 66% { transform: translate(25px, -35px) scale(1.05); } }
        .animate-mesh-move { animation: mesh-move 20s ease-in-out infinite; }
        .animate-mesh-move-reverse { animation: mesh-move-reverse 25s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export { Login };
export default Login;
