import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function AdminLoginPage() {
  const { loginAdmin } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result = await loginAdmin(email.trim(), password);
    setBusy(false);
    if (result.ok) {
      navigate('/admin');
    } else {
      setError(result.message ?? 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-cream rounded-2xl p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink mb-1">Admin Login</h1>
        <p className="text-sm text-charcoal/60 mb-6">Sign in with your admin email and password.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          required
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm mb-3"
          autoFocus
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm mb-3"
        />
        {error && <p className="text-clay text-xs mb-3">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-ink text-cream py-3 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink transition-colors disabled:opacity-60"
        >
          {busy ? 'Signing in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
