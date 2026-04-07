'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell
} from 'recharts';
import Sidebar from '../../../components/Sidebar';
import AttendanceRing from '../../../components/AttendanceRing';
import { useAuth } from '../../../context/AuthContext';
import { getStudentDashboard } from '../../../lib/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 10, padding: '10px 14px'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 14, fontWeight: 600 }}>
            {p.name}: {p.value}{p.name === 'Attendance' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user?.role !== 'student') router.push('/teacher/dashboard');
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.role === 'student') {
      getStudentDashboard()
        .then(res => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading) return <LoadingSkeleton />;
  if (!data) return null;

  const { student, summary, subjects } = data;
  const chartData = subjects.map(s => ({
    name: s.subject.code,
    Attended: s.attended,
    Total: s.totalClasses,
    Attendance: s.percentage,
    color: s.subject.color
  }));

  const radarData = subjects.map(s => ({
    subject: s.subject.code,
    value: s.percentage,
    fullMark: 100
  }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
                letterSpacing: '-0.02em', marginBottom: 6
              }}>
                Good {getGreeting()}, <span className="gradient-text">{student.name.split(' ')[0]}</span> 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                {student.rollNumber} · {student.department} · Semester {student.semester}
              </p>
            </div>

            {/* ✅ SCAN QR BUTTON */}
            <button
              onClick={() => router.push('/scan')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #7c3aed, #14b8a6)',
                border: 'none',
                borderRadius: 14,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.35)';
              }}
            >
              <span style={{ fontSize: 20 }}>📷</span>
              Scan QR Code
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="animate-fade-up stagger-1" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginBottom: 28
        }}>
          <StatCard
            label="Overall Attendance"
            value={`${summary.overallPercentage}%`}
            icon="📊"
            color={summary.overallPercentage >= 75 ? '#10b981' : '#f43f5e'}
            sub={summary.overallPercentage >= 75 ? '✓ Above threshold' : '⚠ Below 75%'}
          />
          <StatCard label="Subjects Enrolled" value={summary.totalSubjects} icon="📚" color="#7c3aed" sub="This semester" />
          <StatCard label="Classes Attended" value={summary.totalAttended} icon="✅" color="#14b8a6" sub={`of ${summary.totalClasses} total`} />
          <StatCard
            label="Subjects at Risk"
            value={summary.subjectsBelowThreshold}
            icon="⚠️"
            color={summary.subjectsBelowThreshold > 0 ? '#f43f5e' : '#10b981'}
            sub={summary.subjectsBelowThreshold > 0 ? 'Need attention' : 'All good!'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
          {/* Bar Chart */}
          <div className="glass-card animate-fade-up stagger-2" style={{ padding: 24 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4
            }}>Attendance by Subject</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Classes attended vs total</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Total" fill="rgba(255,255,255,0.06)" radius={[4,4,0,0]} />
                <Bar dataKey="Attended" radius={[4,4,0,0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color || '#7c3aed'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Overall ring */}
          <div className="glass-card animate-fade-up stagger-3" style={{
            padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
              marginBottom: 4, textAlign: 'center'
            }}>Overall Attendance</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
              Across all subjects
            </p>
            <AttendanceRing percentage={summary.overallPercentage} size={160} strokeWidth={14} />
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {summary.totalAttended} of {summary.totalClasses} classes
              </p>
              {summary.overallPercentage < 75 && (
                <div style={{
                  marginTop: 12, padding: '8px 14px',
                  background: 'rgba(244,63,94,0.1)', borderRadius: 8,
                  border: '1px solid rgba(244,63,94,0.2)'
                }}>
                  <p style={{ color: '#fda4af', fontSize: 12, fontWeight: 600 }}>
                    ⚠ Below 75% threshold
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subject cards */}
        <div className="animate-fade-up stagger-3" style={{ marginBottom: 28 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16
          }}>Subject Breakdown</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {subjects.map((s, i) => (
              <SubjectCard key={s.subject._id} subject={s} delay={i} />
            ))}
          </div>
        </div>

        {/* Radar chart */}
        {subjects.length > 2 && (
          <div className="glass-card animate-fade-up stagger-4" style={{ padding: 24 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4
            }}>Attendance Radar</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Performance across all subjects
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Radar name="Attendance" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
}

function SubjectCard({ subject: s, delay }) {
  const pct = s.percentage;
  const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
  const subColor = s.subject.color || '#7c3aed';

  return (
    <div className="glass-card glass-card-hover" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: subColor }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {s.subject.code}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--text-primary)' }}>
            {s.subject.name}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {s.subject.teacher?.name}
          </p>
        </div>
        <AttendanceRing percentage={pct} size={70} strokeWidth={7} />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>ATTENDED</p>
          <p style={{ fontWeight: 700, color: '#10b981' }}>{s.attended}</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>ABSENT</p>
          <p style={{ fontWeight: 700, color: '#f43f5e' }}>{s.absent}</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>TOTAL</p>
          <p style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{s.totalClasses}</p>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 10 }}>
        <div className="progress-fill" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${subColor}80, ${subColor})`
        }} />
      </div>

      {s.isBelowThreshold ? (
        <div style={{
          padding: '8px 12px', background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8
        }}>
          <p style={{ color: '#fda4af', fontSize: 12, fontWeight: 600 }}>
            ⚠ Need {s.classesNeeded} more class{s.classesNeeded !== 1 ? 'es' : ''} to reach 75%
          </p>
        </div>
      ) : (
        <div style={{
          padding: '8px 12px', background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8
        }}>
          <p style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 600 }}>
            ✓ Above attendance threshold
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{
          fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, color
        }}>{value}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 240, background: 'rgba(10,10,20,0.8)', borderRight: '1px solid var(--border)' }} />
      <main style={{ flex: 1, padding: 32 }}>
        <div className="skeleton" style={{ height: 40, width: 280, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: 200, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300 }} />
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
