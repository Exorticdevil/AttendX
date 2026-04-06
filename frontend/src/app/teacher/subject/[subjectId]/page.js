'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import Sidebar from '../../../../components/Sidebar';
import AttendanceRing from '../../../../components/AttendanceRing';
import { useAuth } from '../../../../context/AuthContext';
import {
  getTeacherSubject, generateQR, getActiveSession,
  invalidateSession, getSessionStudents, downloadSubjectCSV
} from '../../../../lib/api';

export default function TeacherSubjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { subjectId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sessionStudents, setSessionStudents] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [qrTab, setQrTab] = useState('qr'); // 'qr' | 'students'
  const [duration, setDuration] = useState(15);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user?.role !== 'teacher') router.push('/student/dashboard');
  }, [user, authLoading]);

  const fetchData = useCallback(() => {
    if (!user || !subjectId) return;
    Promise.all([
      getTeacherSubject(subjectId),
      getActiveSession(subjectId)
    ]).then(([subRes, sessionRes]) => {
      setData(subRes.data);
      if (sessionRes.data.session) {
        setActiveSession(sessionRes.data.session);
        fetchSessionStudents(sessionRes.data.session.sessionId);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user, subjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchSessionStudents = async (sessionId) => {
    try {
      const res = await getSessionStudents(sessionId);
      setSessionStudents(res.data.records || []);
    } catch {}
  };

  // Countdown timer
  useEffect(() => {
    if (!activeSession) { setCountdown(null); return; }
    const tick = () => {
      const remaining = new Date(activeSession.expiresAt) - new Date();
      if (remaining <= 0) {
        setCountdown('Expired');
        setActiveSession(null);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Poll students every 10 seconds
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => fetchSessionStudents(activeSession.sessionId), 10000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleGenerateQR = async () => {
    setGenerating(true);
    try {
      const res = await generateQR(subjectId, duration);
      setActiveSession(res.data.session);
      setSessionStudents([]);
      setQrTab('qr');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleInvalidate = async () => {
    if (!activeSession) return;
    if (!confirm('End the current QR session?')) return;
    try {
      await invalidateSession(activeSession.sessionId);
      setActiveSession(null);
      setSessionStudents([]);
      setCountdown(null);
      fetchData();
    } catch {}
  };

  const handleDownloadCSV = () => {
    const url = downloadSubjectCSV(subjectId);
    const token = document.cookie.match(/token=([^;]+)/)?.[1]
      || (typeof window !== 'undefined' && document.cookie);
    // Use anchor download
    const a = document.createElement('a');
    a.href = url;
    a.click();
  };

  if (authLoading || loading) return <LoadingPage />;
  if (!data) return null;

  const { subject, studentStats, sessions, monthlyTrend } = data;

  const trendData = monthlyTrend.map(m => ({
    month: `${m._id.year}/${String(m._id.month).padStart(2,'0')}`,
    count: m.count
  }));

  const statusColor = activeSession ? '#10b981' : '#505070';
  const subColor = subject.color || '#7c3aed';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 28 }}>
          <button
            onClick={() => router.back()}
            className="btn-ghost"
            style={{ marginBottom: 16, fontSize: 13 }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: subColor }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {subject.code}
                </span>
                <span className={`badge ${activeSession ? 'badge-green' : 'badge-amber'}`}>
                  {activeSession ? '● Live Session' : '○ No Active Session'}
                </span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.02em', marginBottom: 6
              }}>{subject.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {subject.totalStudents} students · {subject.totalClasses} classes conducted
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={handleDownloadCSV} style={{ fontSize: 13 }}>
                ↓ Download CSV
              </button>
              {!activeSession ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="input-field"
                    style={{ width: 120, padding: '10px 12px', fontSize: 13 }}
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                  <button className="btn-primary" onClick={handleGenerateQR} disabled={generating}>
                    {generating ? 'Generating...' : '⬡ Generate QR'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleInvalidate}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                    color: '#fda4af', borderRadius: 10, padding: '10px 18px',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  ✕ End Session
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: activeSession ? '1fr 380px' : '1fr', gap: 20, marginBottom: 24 }}>
          {/* Left column */}
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              <div className="stat-card">
                <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>TOTAL CLASSES</p>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#7c3aed' }}>{subject.totalClasses}</p>
              </div>
              <div className="stat-card">
                <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>STUDENTS</p>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#14b8a6' }}>{subject.totalStudents}</p>
              </div>
              <div className="stat-card">
                <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>AVG RATE</p>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f59e0b' }}>
                  {studentStats.length > 0
                    ? `${Math.round(studentStats.reduce((s, x) => s + x.percentage, 0) / studentStats.length)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Trend chart */}
            {trendData.length > 0 && (
              <div className="glass-card" style={{ padding: 22, marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                  Monthly Attendance Trend
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10 }}
                    />
                    <Line type="monotone" dataKey="count" stroke={subColor} strokeWidth={2.5}
                      dot={{ fill: subColor, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Student table */}
            <div className="glass-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Student Attendance</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-red">{studentStats.filter(s => s.isBelowThreshold).length} at risk</span>
                  <span className="badge badge-green">{studentStats.filter(s => !s.isBelowThreshold).length} eligible</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Attended</th>
                      <th>Absent</th>
                      <th>Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentStats.map((s) => (
                      <tr key={s.student._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                          {s.student.rollNumber || 'N/A'}
                        </td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.student.name}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{s.attended}</td>
                        <td style={{ color: '#f43f5e', fontWeight: 600 }}>{s.absent}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="progress-bar" style={{ width: 60 }}>
                              <div className="progress-fill" style={{
                                width: `${s.percentage}%`,
                                background: s.percentage >= 75 ? '#10b981' : s.percentage >= 60 ? '#f59e0b' : '#f43f5e'
                              }} />
                            </div>
                            <span style={{
                              fontSize: 13, fontWeight: 700,
                              color: s.percentage >= 75 ? '#10b981' : s.percentage >= 60 ? '#f59e0b' : '#f43f5e'
                            }}>
                              {s.percentage}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${s.isBelowThreshold ? 'badge-red' : 'badge-green'}`}>
                            {s.isBelowThreshold ? 'SHORT' : 'ELIGIBLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {studentStats.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                          No students enrolled
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* QR Panel */}
          {activeSession && (
            <div>
              <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 24 }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
                  {[['qr', '⬡ QR Code'], ['students', `👥 Present (${sessionStudents.length})`]].map(([tab, label]) => (
                    <button
                      key={tab}
                      onClick={() => setQrTab(tab)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                        background: qrTab === tab ? 'rgba(139,92,246,0.2)' : 'transparent',
                        color: qrTab === tab ? '#c4b5fd' : 'var(--text-muted)'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {qrTab === 'qr' ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Session expires in</p>
                      <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800,
                        color: countdown?.includes(':') && parseInt(countdown) < 2 ? '#f43f5e' : '#10b981'
                      }}>
                        {countdown || '--:--'}
                      </p>
                    </div>

                    <div className="qr-glow" style={{
                      display: 'inline-block', padding: 16, borderRadius: 20,
                      background: 'white', marginBottom: 16
                    }}>
                      {activeSession.qrCodeImage ? (
                        <img
                          src={activeSession.qrCodeImage}
                          alt="QR Code"
                          style={{ width: 240, height: 240, display: 'block', borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{
                          width: 240, height: 240, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', background: '#f5f5f5', borderRadius: 8
                        }}>
                          <p style={{ color: '#666', fontSize: 14 }}>QR Code</p>
                        </div>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>
                      Subject: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{subject.name}</span>
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
                      Students must be within 100m of classroom
                    </p>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 16px', background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                        animation: 'pulse 2s ease-in-out infinite'
                      }} />
                      <span style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 600 }}>
                        {sessionStudents.length} student{sessionStudents.length !== 1 ? 's' : ''} marked present
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                      Live updates every 10 seconds
                    </p>
                    {sessionStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <p style={{ fontSize: 32, marginBottom: 8 }}>⏳</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Waiting for students to scan...</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                        {sessionStudents.map((r, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px',
                            background: 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.15)',
                            borderRadius: 10
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
                            }}>
                              {r.student?.name?.charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {r.student?.name}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {r.student?.rollNumber} · {r.distance}m away
                              </p>
                            </div>
                            <span className="badge badge-green">✓</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Session history */}
        {sessions.length > 0 && (
          <div className="glass-card animate-fade-up" style={{ padding: 22 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              Session History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((session, i) => (
                <div key={session._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: 10
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Class {sessions.length - i}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(session.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                        {session.attendanceCount} present
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {subject.totalStudents - session.attendanceCount} absent
                      </p>
                    </div>
                    <div style={{ width: 60 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${subject.totalStudents > 0 ? (session.attendanceCount / subject.totalStudents) * 100 : 0}%`,
                          background: '#10b981'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}

function LoadingPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 240, background: 'rgba(10,10,20,0.8)', borderRight: '1px solid var(--border)' }} />
      <main style={{ flex: 1, padding: 32 }}>
        <div className="skeleton" style={{ height: 30, width: 100, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 40, width: 350, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: 250, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </main>
    </div>
  );
}
