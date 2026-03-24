'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const response = await fetch('/api/agent/session', { cache: 'no-store' });

        if (response.ok && !ignore) {
          router.replace('/agent/dashboard');
        }
      } catch {
        // Ignore passive session check failures on the login screen.
      }
    }

    loadSession();

    return () => {
      ignore = true;
    };
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });

      if (res.ok) {
        router.push('/agent/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (e) {
      setError('Could not connect to server. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .login-page {
          min-height: 100vh; background: #0a1628;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem; font-family: DM Sans, sans-serif;
          position: relative; overflow: hidden;
        }
        .login-card {
          width: 100%; max-width: 420px;
          background: rgba(17,34,64,0.9);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 20px; padding: 2.5rem;
          backdrop-filter: blur(12px); position: relative; z-index: 1;
        }
        .login-input {
          width: 100%; padding: 0.75rem 1rem;
          background: rgba(10,22,40,0.8);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff; font-size: 0.9rem;
          outline: none; font-family: DM Sans, sans-serif; transition: border-color 0.2s;
        }
        .login-input:focus { border-color: rgba(201,168,76,0.5); }
        .login-input::placeholder { color: #8a9bb5; }
        .login-btn {
          width: 100%; padding: 0.85rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          color: #fff; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; font-family: DM Sans, sans-serif;
          box-shadow: 0 6px 20px rgba(192,57,43,0.4);
          transition: opacity 0.2s, transform 0.2s;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="login-page">
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,57,43,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'linear-gradient(135deg, #c0392b, #e74c3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 20px rgba(192,57,43,0.4)', fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>A</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: '#fff', marginBottom: '0.3rem' }}>Agent Portal</h1>
            <p style={{ color: '#8a9bb5', fontSize: '0.85rem' }}>Algebra Enterprises</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.2rem', color: '#e74c3c', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a9bb5', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address</label>
              <input type="email" required placeholder="agent@algebraenterprises.in" className="login-input" value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a9bb5', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
              <input type="password" required placeholder="••••••••" className="login-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/" style={{ color: '#8a9bb5', fontSize: '0.82rem', textDecoration: 'none' }}>← Back to Website</Link>
          </div>
        </div>
      </div>
    </>
  );
}
