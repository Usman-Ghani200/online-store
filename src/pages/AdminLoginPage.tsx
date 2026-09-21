import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function AdminLoginPage() {
  const { loginAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(password)) {
      navigate('/admin');
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-cream rounded-2xl p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink mb-1">Admin Login</h1>
        <p className="text-sm text-charcoal/60 mb-6">Enter the store admin password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm mb-3"
          autoFocus
        />
        {error && <p className="text-clay text-xs mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full bg-ink text-cream py-3 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink transition-colors"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
