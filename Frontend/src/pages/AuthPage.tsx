import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/lib/useToast';
import { useAuth } from '@/lib/authContext';
import { apiClient } from '@/lib/apiClient';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, CheckCircle, XCircle } from 'lucide-react';

interface Props { mode: 'login' | 'register'; }

// Extract a human-readable error message from any axios error shape
function extractErrorMessage(err: any): string {
  const data = err?.response?.data;
  if (!data) return err?.message || 'Something went wrong. Please try again.';

  // Validation errors array: { errors: [{field, message}] }
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e: any) => e.message).join(' • ');
  }

  // Standard message field
  if (data.message && data.message !== 'Validation failed') {
    return data.message;
  }

  // msg field (used by some endpoints like logout)
  if (data.msg) return data.msg;

  return err?.message || 'Something went wrong. Please try again.';
}

// Password strength requirements
function getPasswordStrength(pwd: string) {
  return {
    length: pwd.length >= 8,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    symbol: /[^A-Za-z0-9]/.test(pwd),
  };
}

export default function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { onLoginSuccess } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';
  const strength = getPasswordStrength(password);
  const allStrong = Object.values(strength).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Client-side validation ──────────────────────────────
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isLogin && !allStrong) {
      setError('Your password does not meet the requirements shown below.');
      setShowStrength(true);
      return;
    }
    // ────────────────────────────────────────────────────────

    setSubmitting(true);
    try {
      if (isLogin) {
        // 1. Login
        const loginResponse = await apiClient.login(email, password);

        // 2. Update auth context (sets isAuthenticated = true)
        await onLoginSuccess(loginResponse);

        // 3. Fetch profiles to decide where to navigate
        let profiles: any[] = [];
        try {
          const profilesRes = await apiClient.getProfiles();
          profiles = Array.isArray(profilesRes) ? profilesRes : (profilesRes?.data || []);
        } catch {
          // If getProfiles fails after login, still navigate to profiles page
          profiles = [];
        }

        toast.success('Welcome back!');

        const selectedPlanId = sessionStorage.getItem('selectedPlanId');
        if (selectedPlanId) sessionStorage.setItem('redirectToPlan', selectedPlanId);

        navigate(profiles.length === 0 ? '/create-profile' : '/profiles');

      } else {
        // 1. Register
        await apiClient.register({ name: name.trim(), email, phone, password });

        // 2. Auto-login after registration
        const loginResponse = await apiClient.login(email, password);

        // 3. Update auth context
        await onLoginSuccess(loginResponse);

        toast.success('Account created! Welcome to StreamFlix.');

        const selectedPlanId = sessionStorage.getItem('selectedPlanId');
        if (selectedPlanId) sessionStorage.setItem('redirectToPlan', selectedPlanId);

        navigate('/profiles');
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const StrengthRow = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-400' : 'text-gray-500'}`}>
      {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-4 sm:px-6 lg:px-12 h-16 flex items-center">
        <button onClick={() => navigate('/')} className="flex items-center gap-1">
          <span className="text-brand-500 text-3xl font-display tracking-wider">STREAM</span>
          <span className="text-white text-3xl font-display tracking-wider">FLIX</span>
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 overflow-hidden -z-10">
          <img
            src="https://images.pexels.com/photos/7991394/pexels-photo-7991394.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-ink-950/70" />
        </div>

        <div className="w-full max-w-md glass rounded-2xl p-8 border border-ink-600 shadow-2xl animate-scaleIn">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-400 mb-8">
            {isLogin ? 'Sign in to continue watching' : 'Start streaming in minutes'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name — register only */}
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Carter"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {/* Phone — register only */}
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">
                  Phone <span className="text-gray-600 text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!isLogin) setShowStrength(true);
                  }}
                  onFocus={() => { if (!isLogin) setShowStrength(true); }}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength indicator — register only */}
              {!isLogin && showStrength && (
                <div className="mt-2 p-3 bg-ink-900/60 rounded-lg border border-ink-700 grid grid-cols-2 gap-1.5">
                  <StrengthRow ok={strength.length}    label="8+ characters" />
                  <StrengthRow ok={strength.uppercase} label="Uppercase letter" />
                  <StrengthRow ok={strength.lowercase} label="Lowercase letter" />
                  <StrengthRow ok={strength.number}    label="Number" />
                  <StrengthRow ok={strength.symbol}    label="Special character (!@#...)" />
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2.5 animate-fadeIn leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-lg py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? (
              <>
                New to StreamFlix?{' '}
                <button onClick={() => navigate('/register')} className="text-brand-400 hover:text-brand-300 font-medium">
                  Sign up now
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => navigate('/login')} className="text-brand-400 hover:text-brand-300 font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 mx-auto"
            >
              <ArrowLeft size={14} /> Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
