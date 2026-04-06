'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { validateSession, markAttendance } from '../../lib/api';

// Canvas fingerprinting for device ID
function getDeviceFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AttendX🎓', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device', 4, 45);
    const raw = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return `fp_${Math.abs(hash).toString(36)}_${navigator.hardwareConcurrency || 0}_${screen.width}x${screen.height}`;
  } catch {
    return `fp_fallback_${Math.random().toString(36).substr(2)}`;
  }
}

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [step, setStep] = useState('loading'); // loading | session | locating | marking | success | error
  const [sessionInfo, setSessionInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/scan?session=${sessionId}`);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!sessionId || authLoading || !user) return;

    validateSession(sessionId)
      .then(res => {
        setSessionInfo(res.data.session);
        setStep('session');
        // Start countdown
        const tick = () => {
          const remaining = new Date(res.data.session.expiresAt) - new Date();
          if (remaining <= 0) {
            setStep('error');
            setMessage('This QR code has expired. Ask your teacher for a new one.');
          } else {
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setCountdown(`${mins}:${secs.toString().padStart(2,'0')}`);
          }
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
      })
      .catch(err => {
        setStep('error');
        setMessage(err.response?.data?.error || 'Invalid or expired QR code.');
      });
  }, [sessionId, user, authLoading]);

  const handleMarkAttendance = () => {
    setStep('locating');

    if (!navigator.geolocation) {
      setStep('error');
      setMessage('Your device does not support location services. Cannot mark attendance.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStep('marking');

        const fingerprint = getDeviceFingerprint();
        try {
          const res = await markAttendance({
            sessionId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            deviceFingerprint: fingerprint
          });
          setStep('success');
          setMessage(res.data.message);
        } catch (err) {
          setStep('error');
          setMessage(err.response?.data?.error || 'Failed to mark attendance.');
        }
      },
      (err) => {
        setStep('error');
        setMessage(
          err.code === 1
            ? 'Location access denied. Please allow location access and try again.'
            : 'Unable to get your location. Please ensure GPS is enabled.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (authLoading || step === 'loading') return <StatusPage icon="⬡" title="Validating QR Code..." subtitle="Please wait" pulse />;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: '0 0 30px rgba(124,58,237,0.4)', marginBottom: 12
          }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="white" opacity="0.9"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="white" opacity="0.6"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="white" opacity="0.6"/>
              <rect x="20" y="20" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
            <span className="gradient-text">AttendX</span>
          </h1>
        </div>

        {/* Session card */}
        {step === 'session' && sessionInfo && (
          <div className="glass-card animate-scale-in" style={{ padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                Mark Your Attendance
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tap the button to check in</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                padding: '16px 20px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 12, marginBottom: 12
              }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>SUBJECT</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {sessionInfo.subject?.name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {sessionInfo.subject?.code} · {sessionInfo.teacher?.name}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)', borderRadius: 10
                }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>STUDENT</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</p>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: countdown && parseInt(countdown) < 2 ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${countdown && parseInt(countdown) < 2 ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  borderRadius: 10
                }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>EXPIRES IN</p>
                  <p style={{
                    fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)',
                    color: countdown && parseInt(countdown) < 2 ? '#f43f5e' : '#10b981'
                  }}>{countdown}</p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px 16px', marginBottom: 20,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10
            }}>
              <p style={{ color: '#fcd34d', fontSize: 13 }}>
                📍 Your location will be verified. You must be within <strong>100 meters</strong> of the classroom.
              </p>
            </div>

            <button className="btn-primary" onClick={handleMarkAttendance} style={{ width: '100%', padding: '14px 24px', fontSize: 16 }}>
              📍 Mark My Attendance
            </button>
          </div>
        )}

        {step === 'locating' && (
          <div className="glass-card animate-scale-in" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(20,184,166,0.1)',
              border: '2px solid rgba(20,184,166,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, animation: 'pulse 1.5s ease-in-out infinite'
            }}>📍</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Getting Your Location
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Please allow location access when prompted...
            </p>
          </div>
        )}

        {step === 'marking' && (
          <div className="glass-card animate-scale-in" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, border: '3px solid rgba(139,92,246,0.3)',
              borderTopColor: '#7c3aed', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 20px'
            }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Marking Attendance...
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verifying your location</p>
          </div>
        )}

        {step === 'success' && (
          <div className="glass-card animate-scale-in" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(16,185,129,0.15)',
              border: '2px solid rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
            }}>✓</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              marginBottom: 8, color: '#10b981'
            }}>Attendance Marked!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>{message}</p>
            <button className="btn-primary" onClick={() => router.push('/student/dashboard')} style={{ width: '100%' }}>
              Go to Dashboard →
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="glass-card animate-scale-in" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(244,63,94,0.1)',
              border: '2px solid rgba(244,63,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
            }}>✕</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              marginBottom: 8, color: '#f43f5e'
            }}>Could Not Mark Attendance</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>{message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => router.back()} style={{ flex: 1 }}>
                ← Go Back
              </button>
              <button className="btn-primary" onClick={() => router.push('/student/dashboard')} style={{ flex: 1 }}>
                Dashboard
              </button>
            </div>
          </div>
        )}

        {!sessionId && (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Scan a QR Code
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Ask your teacher to display the QR code, then scan it with your phone's camera.
            </p>
            <button className="btn-ghost" onClick={() => router.push('/student/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
      `}</style>
    </div>
  );
}

function StatusPage({ icon, title, subtitle, pulse }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 48, marginBottom: 16,
          animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none'
        }}>{icon}</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</p>
        <p style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
    </div>
  );
}
