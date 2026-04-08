import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Mail, Phone, Lock, Check, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const step1Schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(1, 'Select a business type'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Valid phone number required'),
});

const step2Schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'other', label: 'Other' },
];

const steps = [
  { number: 1, title: 'Business Info' },
  { number: 2, title: 'Security' },
  { number: 3, title: 'Complete' },
];

const Logo = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
    <defs>
      <linearGradient id="regLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4EECD3" />
        <stop offset="100%" stopColor="#4EEC90" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#regLogoGrad)" strokeWidth="3" />
    <path d="M60 130 L100 55 L140 130 L120 130 L100 90 L80 130 Z" fill="url(#regLogoGrad)" />
    <circle cx="100" cy="135" r="4" fill="#4EECD3" />
  </svg>
);

const StepIndicator = ({ currentStep, className = '' }) => (
  <div className={`flex items-center justify-center gap-0 ${className}`}>
    {steps.map((step, i) => (
      <div key={step.number} className="flex items-center">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep > step.number ? 'bg-brand-accent border-brand-accent' : currentStep === step.number ? 'border-brand-accent text-brand-accent' : 'border-brand-border text-brand-muted'}`}>
            {currentStep > step.number ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-brand-base" /> : <span className="text-xs sm:text-sm font-semibold">{step.number}</span>}
          </div>
          <span className={`text-[10px] sm:text-xs mt-1.5 whitespace-nowrap ${currentStep >= step.number ? 'text-brand-accent' : 'text-brand-muted'}`}>{step.title}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-10 sm:w-16 h-0.5 mx-1.5 sm:mx-2 mb-5 sm:mb-6 transition-colors duration-300 ${currentStep > step.number ? 'bg-brand-accent' : 'bg-brand-border'}`} />
        )}
      </div>
    ))}
  </div>
);

function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { businessName: '', businessType: '', contactPerson: '', email: '', phone: '' },
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleStep1 = step1Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  });

  const handleStep2 = step2Form.handleSubmit(async (data) => {
    setLoading(true);
    try {
      const payload = { ...formData, ...data, name: formData.contactPerson, company: formData.businessName };
      await registerUser(payload);
      setCurrentStep(3);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Left Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-[60%] bg-brand-base relative overflow-hidden flex-col items-center justify-center px-16"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #4EECD3 0%, transparent 70%)', top: '-10%', right: '-10%', animation: 'mesh-move 20s ease-in-out infinite' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #B84EEC 0%, transparent 70%)', bottom: '-15%', left: '-5%', animation: 'mesh-move-reverse 25s ease-in-out infinite' }} />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <Logo size={120} className="mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Azoury</h1>
          <p className="text-brand-accent text-sm font-medium mb-16">End-to-End Supply Chain Intelligence</p>
          <StepIndicator currentStep={currentStep} />
        </div>
      </motion.div>

      {/* Mobile Brand Header with Step Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:hidden relative overflow-hidden bg-brand-base"
      >
        {/* Mobile mesh background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[300px] h-[300px] rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(circle, #4EECD3 0%, transparent 70%)', top: '-50%', right: '-20%', animation: 'mesh-move 20s ease-in-out infinite' }} />
          <div className="absolute w-[250px] h-[250px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #B84EEC 0%, transparent 70%)', bottom: '-40%', left: '-15%', animation: 'mesh-move-reverse 25s ease-in-out infinite' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center pt-8 pb-6 px-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Logo size={56} className="mb-3" />
          </motion.div>
          <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} className="text-xl font-bold text-brand-primary tracking-tight">
            Azoury
          </motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }} className="text-brand-accent text-xs font-medium mt-0.5 mb-5">
            Create your account
          </motion.p>

          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <StepIndicator currentStep={currentStep} />
          </motion.div>
        </div>
      </motion.div>

      {/* Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex-1 bg-brand-surface flex items-start lg:items-center justify-center px-5 py-6 sm:px-8 sm:py-8 lg:p-12"
      >
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={currentStep}>
            {currentStep === 1 && (
              <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-1">Business Information</h2>
                <p className="text-brand-secondary text-sm mb-5 sm:mb-8">Tell us about your business</p>

                <form onSubmit={handleStep1} className="space-y-3.5 sm:space-y-4">
                  <div>
                    <Label className="block mb-1.5 text-sm">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <Input {...step1Form.register('businessName')} placeholder="Your company name" className="pl-10 h-11" />
                    </div>
                    {step1Form.formState.errors.businessName && <p className="text-brand-error text-xs mt-1">{step1Form.formState.errors.businessName.message}</p>}
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm">Business Type</Label>
                    <Select value={step1Form.watch('businessType')} onValueChange={(val) => step1Form.setValue('businessType', val)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((bt) => (
                          <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {step1Form.formState.errors.businessType && <p className="text-brand-error text-xs mt-1">{step1Form.formState.errors.businessType.message}</p>}
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm">Contact Person</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <Input {...step1Form.register('contactPerson')} placeholder="Full name" className="pl-10 h-11" />
                    </div>
                    {step1Form.formState.errors.contactPerson && <p className="text-brand-error text-xs mt-1">{step1Form.formState.errors.contactPerson.message}</p>}
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <Input {...step1Form.register('email')} type="email" placeholder="you@company.com" className="pl-10 h-11" />
                    </div>
                    {step1Form.formState.errors.email && <p className="text-brand-error text-xs mt-1">{step1Form.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <Input {...step1Form.register('phone')} placeholder="+961 XX XXX XXX" className="pl-10 h-11" />
                    </div>
                    {step1Form.formState.errors.phone && <p className="text-brand-error text-xs mt-1">{step1Form.formState.errors.phone.message}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11 mt-2">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>

                <p className="text-brand-muted text-sm text-center mt-5">
                  Already have an account?{' '}
                  <Link to="/login" className="text-brand-accent hover:underline font-medium">Sign In</Link>
                </p>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-1">Set Up Security</h2>
                <p className="text-brand-secondary text-sm mb-5 sm:mb-8">Create a strong password for your account</p>

                <form onSubmit={handleStep2} className="space-y-4">
                  <div>
                    <Label className="block mb-1.5 text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <Input
                        {...step2Form.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        className="pl-10 pr-10 h-11"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary p-1">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {step2Form.formState.errors.password && <p className="text-brand-error text-xs mt-1">{step2Form.formState.errors.password.message}</p>}
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <Input {...step2Form.register('confirmPassword')} type="password" placeholder="Repeat password" className="pl-10 h-11" />
                    </div>
                    {step2Form.formState.errors.confirmPassword && <p className="text-brand-error text-xs mt-1">{step2Form.formState.errors.confirmPassword.message}</p>}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)} className="flex-1 h-11">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-11">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="text-center py-8 sm:py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }} className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-brand-accent flex items-center justify-center">
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-brand-base" />
                  </motion.div>
                </motion.div>

                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2 sm:mb-3">Account Created!</h2>
                <p className="text-brand-secondary text-sm mb-6 sm:mb-8 max-w-sm mx-auto px-4">
                  Your account is pending approval. Our team will review your application and activate your account within 24 hours.
                </p>
                <p className="text-brand-muted text-xs mb-6 sm:mb-8 px-4">
                  You will receive an email at <span className="text-brand-accent break-all">{formData.email}</span> once approved.
                </p>

                <Button onClick={() => navigate('/login')} size="lg" className="h-11">Go to Sign In</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        @keyframes mesh-move { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        @keyframes mesh-move-reverse { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-40px, 30px) scale(0.95); } 66% { transform: translate(25px, -35px) scale(1.05); } }
        .animate-mesh-move { animation: mesh-move 20s ease-in-out infinite; }
        .animate-mesh-move-reverse { animation: mesh-move-reverse 25s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export { Register };
export default Register;
