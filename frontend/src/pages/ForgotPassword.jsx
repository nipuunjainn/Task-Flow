import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { dark, toggle } = useTheme();

  const submitHandler = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Check your inbox for a reset link');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm animate-slide-up">
          <h1 className="text-2xl font-black text-primary">Reset your password</h1>
          <p className="mt-2 text-sm text-secondary">
            Enter your email and we&apos;ll send you instructions to reset your password.
          </p>

          <form onSubmit={submitHandler} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full rounded-xl input-field px-4 py-3 text-sm"
              />
            </div>
            <button disabled={loading} className="w-full rounded-xl btn-primary px-4 py-3 text-sm">
              {loading ? 'Sending...' : 'Send instructions'}
            </button>
          </form>

          {message && <p className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <p className="mt-6 text-center text-sm text-secondary">
            <Link to="/" className="font-semibold text-[var(--accent)] hover:underline">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}