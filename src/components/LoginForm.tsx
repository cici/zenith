import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';

export default function LoginForm() {
  const { signIn, signUp, loading, error, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

  useEffect(() => {
    if (success && mode === 'login') {
      navigate('/index');
    }
  }, [success, mode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        setSuccess(true);
      } else {
        await signUp(email, password);
        setSuccess(true);
      }
    } catch (err) {
      console.error(`Error during ${mode}:`, err);
      setSuccess(false);
    }
  };

  if (user) {
    return <div>✅ Logged in as {user.email}</div>;
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10, fontSize: 16 }}>
          {loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 }}
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setSuccess(false); }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {success && mode === 'login' && <div style={{ color: 'green' }}>Login successful!</div>}
        {success && mode === 'signup' && <div style={{ color: 'green' }}>Signup successful! Please check your email to confirm your account.</div>}
      </form>
    </AuthLayout>
  );
} 