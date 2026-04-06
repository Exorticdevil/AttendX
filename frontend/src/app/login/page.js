'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { loginUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      loginUser(res.data.token, res.data.user);
      if (res.data.user.role === 'teacher') router.push('/teacher/dashboard');
      else router.push('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: '0 0 40px rgba(124,58,237,0.4)',
            marginBottom: 20
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="white" opacity="0.9"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="white" opacity="0.6"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="white" opacity="0.6"/>
              <rect x="20" y="20" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
              <rect x="18" y="18" width="3" height="3" rx="0.5" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 8
          }}>
            <span className="gradient-text">AttendX</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Smart QR Attendance Management
          </p>
        </div>

        {/* Card */}
        <div className="glass-card animate-fade-up stagger-1" style={{ padding: 32 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
            marginBottom: 6
          }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Sign in with your institutional email
          </p>

          {error && (
            <div style={{
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              color: '#fda4af', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 5zm0 6a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: 8
              }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', display: 'flex'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2.5 3A1.5 1.5 0 001 4.5v.793c.026.009.051.02.076.032L8 8.982l6.924-3.657A.5.5 0 0115 5.293V4.5A1.5 1.5 0 0013.5 3h-11z"/>
                    <path d="M15 6.954L8.978 10.41a.5.5 0 01-.956 0L1 6.954V11.5A1.5 1.5 0 002.5 13h11a1.5 1.5 0 001.5-1.5V6.954z"/>
                  </svg>
                </span>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  required
                  style={{ paddingLeft: 42 }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: 8
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', display: 'flex'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a4 4 0 00-4 4v1H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm2 5V5a2 2 0 10-4 0v1h4z"/>
                  </svg>
                </span>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', padding: 0
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M10.5 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                      <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 00-2.79.588l.77.771A5.944 5.944 0 018 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0114.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                      <path d="M11.297 9.176a3.5 3.5 0 00-4.474-4.474l.823.823a2.5 2.5 0 012.829 2.829l.822.822zm-2.943 1.299l.822.822a3.5 3.5 0 01-4.474-4.474l.823.823a2.5 2.5 0 002.829 2.829z"/>
                      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 001.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 018 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709z"/>
                      <path d="M13.646 14.354l-12-12 .708-.708 12 12-.708.708z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="animate-fade-up stagger-2" style={{
          marginTop: 20, padding: '16px 20px',
          background: 'rgba(20,184,166,0.06)',
          border: '1px solid rgba(20,184,166,0.15)',
          borderRadius: 12
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Demo Credentials
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            🧑‍🏫 Teacher: <span style={{ color: '#5eead4', fontFamily: 'var(--font-mono)' }}>priya.sharma@college.edu</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            🎓 Student: <span style={{ color: '#5eead4', fontFamily: 'var(--font-mono)' }}>arjun.mehta@student.edu</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Password: <span style={{ color: '#5eead4', fontFamily: 'var(--font-mono)' }}>teacher123 / student123</span>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          Access restricted to registered institutional emails only
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
