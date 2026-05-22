import React, { useState } from 'react';
import { Droplets, Eye, EyeOff, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/src/lib/utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'donor' | 'hospital'>('admin');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        const data: any = { name, email, password, role };
        if (role === 'donor' && bloodGroup) data.bloodGroup = bloodGroup;
        if (phone) data.phone = phone;
        if (role === 'hospital' && orgName) data.organizationName = orgName;
        await register(data);
        setSuccess('Account created successfully!');
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'donor' | 'hospital') => {
    switch (type) {
      case 'admin':
        setEmail('admin@vitalpulse.com');
        setPassword('admin123');
        break;
      case 'donor':
        setEmail('julianne@example.com');
        setPassword('donor123');
        break;
      case 'hospital':
        setEmail('stjude@hospital.com');
        setPassword('hospital123');
        break;
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-64 -right-64 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-secondary/3 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-tertiary/2 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl blood-gradient flex items-center justify-center shadow-xl shadow-primary/20">
              <Droplets className="w-8 h-8 text-white fill-current" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
            VitalPulse Systems
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Blood Bank Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-surface-container-high/30 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex bg-surface-container-low">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}
              className={cn(
                "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                !isRegister
                  ? "text-secondary border-b-2 border-secondary bg-white"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}
              className={cn(
                "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                isRegister
                  ? "text-secondary border-b-2 border-secondary bg-white"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Error / Success Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl text-error text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-tertiary/10 rounded-xl text-tertiary text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            {/* Name (register only) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Dr. Sarah Chen"
                  className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@vitalpulse.com"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Register-only fields */}
            {isRegister && (
              <>
                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Account Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['admin', 'donor', 'hospital'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                          role === r
                            ? "bg-secondary text-white shadow-sm"
                            : "bg-surface-container-low text-slate-500 hover:bg-surface-container-high"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blood Group (donors) */}
                {role === 'donor' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Blood Group
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBloodGroup(bg)}
                          className={cn(
                            "py-2 rounded-lg text-xs font-bold transition-all",
                            bloodGroup === bg
                              ? "bg-primary text-white shadow-sm"
                              : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high"
                          )}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organization Name (hospital) */}
                {role === 'hospital' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Hospital / Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="City General Hospital"
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-300"
                    />
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555-0100"
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-300"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                loading
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "blood-gradient text-white shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials (Login only) */}
          {!isRegister && (
            <div className="px-8 pb-8 pt-0">
              <div className="border-t border-surface-container-high/50 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
                  Quick Demo Access
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="py-2 px-3 bg-surface-container-low rounded-lg text-[10px] font-bold text-primary uppercase tracking-wider hover:bg-primary/10 transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('donor')}
                    className="py-2 px-3 bg-surface-container-low rounded-lg text-[10px] font-bold text-tertiary uppercase tracking-wider hover:bg-tertiary/10 transition-colors"
                  >
                    Donor
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('hospital')}
                    className="py-2 px-3 bg-surface-container-low rounded-lg text-[10px] font-bold text-secondary uppercase tracking-wider hover:bg-secondary/10 transition-colors"
                  >
                    Hospital
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
          © 2026 VitalPulse Clinical Systems • v4.2.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
