import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/lib/useToast';
import { useAuth } from '@/lib/authContext';
import { apiClient } from '@/lib/apiClient';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';

interface Props { mode: 'login' | 'register'; }

export default function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { onLoginSuccess } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isLogin && (!name || !phone)) {
      setError('Please fill in all registration fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        // =============== LOGIN FLOW ===============
        // 1. Call login API (sets auth cookies)
        const loginResponse = await apiClient.login(email, password);
        
        // 2. Update Auth Context immediately after login
        // This ensures isAuthenticated becomes true and cookies are verified
        await onLoginSuccess(loginResponse);
        
        // 3. Get profiles to decide next step
        const profilesRes = await apiClient.getProfiles();
        const profiles = Array.isArray(profilesRes) ? profilesRes : (profilesRes?.data || []);
        
        toast.success('Login successful!');
        
        // 4. Check for pending action (subscription flow)
        const selectedPlanId = sessionStorage.getItem('selectedPlanId');
        
        if (profiles.length === 0) {
          // No profiles - go to create profile page
          if (selectedPlanId) {
            sessionStorage.setItem('redirectToPlan', selectedPlanId);
            navigate('/create-profile');
          } else {
            navigate('/create-profile');
          }
        } else {
          // Profiles exist - go to profile selection
          if (selectedPlanId) {
            sessionStorage.setItem('redirectToPlan', selectedPlanId);
          }
          navigate('/profiles');
        }
      } else {
        // =============== REGISTER FLOW ===============
        // 1. Call register API (creates user + primary profile)
        await apiClient.register({ name, email, phone, password });
        
        // 2. Auto-login after registration
        const loginResponse = await apiClient.login(email, password);
        
        // 3. Update Auth Context
        await onLoginSuccess(loginResponse);
        
        toast.success('Registration successful!');
        
        // 4. Check for pending action (subscription flow)
        const selectedPlanId = sessionStorage.getItem('selectedPlanId');
        
        if (selectedPlanId) {
          sessionStorage.setItem('redirectToPlan', selectedPlanId);
        }
        
        // Navigate to profile selection (user will see primary profile)
        navigate('/profiles');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <img src="https://images.pexels.com/photos/7991394/pexels-photo-7991394.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600" alt="" className="w-full h-full object-cover opacity-30" />
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
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Phone</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {error && (
              <div className="text-error-500 text-sm bg-error-500/10 rounded-md px-3 py-2 animate-fadeIn">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full text-lg py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? (
              <>New to StreamFlix? <button onClick={() => navigate('/register')} className="text-brand-400 hover:text-brand-300 font-medium">Sign up now</button></>
            ) : (
              <>Already have an account? <button onClick={() => navigate('/login')} className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button></>
            )}
          </div>

          <div className="mt-4 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 mx-auto">
              <ArrowLeft size={14} /> Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
