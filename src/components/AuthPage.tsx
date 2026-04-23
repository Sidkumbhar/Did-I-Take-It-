import React, { useState } from 'react';
import { Pill, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export const AuthPage = ({ onLogin, onRegister, error, isLoading }: Props) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await onLogin(email, password);
    } else {
      await onRegister(name, email, password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col auth-gradient relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between z-20 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
            <Pill className="text-white" size={20} />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">Did I Take It?</span>
        </div>
        <div className="hidden md:flex gap-8">
          <a href="#" className="text-white/60 hover:text-white text-sm font-bold tracking-wide transition-colors">Features</a>
          <a href="#" className="text-white/60 hover:text-white text-sm font-bold tracking-wide transition-colors">Testimonials</a>
          <a href="#" className="text-white/60 hover:text-white text-sm font-bold tracking-wide transition-colors">Support</a>
        </div>
      </nav>

      {/* Floating decorative elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [12, 15, 12] }} 
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-1/4 left-[15%] p-4 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hidden lg:block shadow-2xl z-10 pointer-events-none"
      >
        <Pill className="text-white/40" size={40} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [-12, -8, -12] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 right-[15%] p-5 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hidden lg:block shadow-2xl z-10 pointer-events-none"
      >
        <CheckCircle2 className="text-white/40" size={48} />
      </motion.div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto z-10 px-6 py-10 gap-12 lg:gap-24">
        
        {/* Left side hero text for desktop */}
        <div className="hidden md:flex flex-col flex-1 text-left">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Health Dashboard v2.0
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Never Miss a <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-white">Dose Again.</span>
            </h1>
            <p className="text-white/60 text-lg lg:text-xl font-medium leading-relaxed max-w-lg mb-10">
              Your personal, intelligent medication manager. Track schedules, maintain streaks, and stay healthy with automated reminders.
            </p>
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white">99%</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Uptime</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white">10k+</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Users</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side form */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          className="w-full max-w-md flex-1"
        >
          {/* Logo for mobile only */}
          <div className="text-center mb-8 md:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-4 shadow-lg">
              <Pill className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Did I Take It?</h1>
            <p className="text-white/60 mt-2 text-sm font-medium">Your personal medication manager</p>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-[32px] p-8 border border-white/15 shadow-2xl relative overflow-hidden">
            {/* Subtle highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            
            {/* Toggle */}
            <div className="flex bg-white/5 rounded-2xl p-1 mb-8 relative">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                mode === 'login' ? 'bg-white text-primary shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Sign In
            </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                mode === 'register' ? 'bg-white text-primary shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm mb-6 font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <>
              <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <motion.div
                      key="name"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="John Doe"
                          required={mode === 'register'}
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white text-primary rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl hover:bg-white/95 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="w-full py-6 text-center z-20">
        <p className="text-white/40 text-xs font-medium tracking-wide">
          © {new Date().getFullYear()} Did I Take It. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
