import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoogleLogin } from '@react-oauth/google';
import * as z from 'zod';
import { Zap, Sun, Moon, ShieldCheck, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const schema = isLogin ? loginSchema : registerSchema;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/dashboard');
  }, [navigate]);

  const submitHandler = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: data.email, password: data.password }
        : { ...data, role: selectedRole };
      const res = await API.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await API.post('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => { setIsLogin((p) => !p); setServerError(''); setSelectedRole('MEMBER'); reset(); };

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
            <Zap size={16} />
          </div>
          <span className="text-lg font-bold text-primary">Task Flow</span>
        </div>
        <button onClick={toggle} className="rounded-lg p-2 text-secondary hover:text-primary transition">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* ── Centered Auth Card ── */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-primary">
              {isLogin
                ? 'Sign in to Task Flow'
                : selectedRole === 'ADMIN'
                  ? 'Create Admin Account'
                  : 'Create Member Account'}
            </h1>
            <p className="mt-2 text-secondary text-sm">
              {isLogin ? 'Enter your credentials to access your workspace' : 'Set up your account and start collaborating'}
            </p>
          </div>

          {/* ── Role Selector (Sign Up only) ── */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider">I want to join as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('MEMBER')}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all border-2 ${
                    selectedRole === 'MEMBER'
                      ? 'border-[var(--accent)] bg-[var(--accent-surface)] shadow-md'
                      : 'border-[var(--border)] card hover:border-[var(--accent-border)]'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    selectedRole === 'MEMBER' ? 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white' : 'bg-[var(--surface-overlay)] text-muted'
                  }`}>
                    <User size={20} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${selectedRole === 'MEMBER' ? 'text-[var(--accent)]' : 'text-primary'}`}>Member</p>
                    <p className="text-[11px] text-muted mt-0.5">View & update tasks</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all border-2 ${
                    selectedRole === 'ADMIN'
                      ? 'border-[var(--accent)] bg-[var(--accent-surface)] shadow-md'
                      : 'border-[var(--border)] card hover:border-[var(--accent-border)]'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    selectedRole === 'ADMIN' ? 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white' : 'bg-[var(--surface-overlay)] text-muted'
                  }`}>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${selectedRole === 'ADMIN' ? 'text-[var(--accent)]' : 'text-primary'}`}>Admin</p>
                    <p className="text-[11px] text-muted mt-0.5">Full project control</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Google Login ── */}
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setServerError('Google sign-in failed')}
              theme={dark ? 'filled_black' : 'outline'}
              shape="pill"
              width="360"
            />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-medium text-muted uppercase tracking-widest">or continue with email</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {serverError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">Your name</label>
                <input type="text" {...register('name')} placeholder="John Doe" className="w-full rounded-xl input-field px-4 py-3 text-sm" />
                {errors.name?.message && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">Email address</label>
              <input type="email" {...register('email')} placeholder="john@company.com" className="w-full rounded-xl input-field px-4 py-3 text-sm" />
              {errors.email?.message && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Password</label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                    Reset it
                  </Link>
                )}
              </div>
              <input type="password" {...register('password')} placeholder="Min 6 characters" className="w-full rounded-xl input-field px-4 py-3 text-sm" />
              {errors.password?.message && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl btn-primary px-4 py-3 text-sm">
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Continue'
                  : `Create ${selectedRole === 'ADMIN' ? 'Admin' : 'Member'} Account →`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            {isLogin ? 'New to Task Flow? ' : 'Have an account? '}
            <button onClick={toggleMode} className="font-semibold text-[var(--accent)] hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}