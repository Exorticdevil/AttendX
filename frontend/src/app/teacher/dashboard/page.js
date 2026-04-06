'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { getTeacherDashboard } from '../../../lib/api';

export default function TeacherDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user?.role !== 'teacher') router.push('/student/dashboard');
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      getTeacherDashboard()
        .then(res => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading) return <LoadingSkeleton />;
  if (!data) return null;

  const { teacher, summary, subjects } = data;

  const chartData = subjects.map(s => ({
    name: s.subject.code,
    Students: s.totalStudents,
    Classes: s.totalClasses,
    Rate: s.overallRate,
    color: s.subject.color || '#7c3aed'
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
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 6
          }}>
            Welcome, <span className="gradient-text">{teacher.name.split(' ')[0]}</span> 👩‍🏫
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {teacher.department} · {teacher.email}
          </p>
        </div>

        {/* Stats */}
        <div className="animate-fade-up stagger-1" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginBottom: 28
        }}>
          <StatCard label="Subjects Teaching" value={summary.totalSubjects} icon="📚" color="#7c3aed" sub="This semester" />
          <StatCard label="Total Students" value={summary.totalStudents} icon="🎓" color="#14b8a6" sub="Across all subjects" />
          <StatCard
            label="Total Classes"
            value={subjects.reduce((s, x) => s + x.totalClasses, 0)}
            icon="🏫" color="#f59e0b" sub="Conducted so far"
          />
          <StatCard
            label="Avg Attendance Rate"
            value={subjects.length > 0
              ? `${Math.round(subjects.reduce((s, x) => s + x.overallRate, 0) / subjects.length)}%`
              : '0%'}
            icon="📈" color="#10b981" sub="Across all subjects"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Bar Chart */}
          <div className="glass-card animate-fade-up stagger-2" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Attendance Rate by Subject
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Overall class participation</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: '#a78bfa' }}
                  formatter={(val) => [`${val}%`, 'Attendance Rate']}
                />
                <Bar dataKey="Rate" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Students per subject */}
          <div className="glass-card animate-fade-up stagger-3" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Students per Subject
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Enrollment overview</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  formatter={(val) => [val, 'Students']}
                />
                <Bar dataKey="Students" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={`${entry.color}99`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject cards */}
        <div className="animate-fade-up stagger-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            My Subjects
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {subjects.map((s) => (
              <SubjectCard key={s.subject._id} subject={s} router={router} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function SubjectCard({ subject: s, router }) {
  const subColor = s.subject.color || '#7c3aed';
  const pct = s.overallRate;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <div
      className="glass-card glass-card-hover"
      style={{ padding: 22, cursor: 'pointer' }}
      onClick={() => router.push(`/teacher/subject/${s.subject._id}`)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${subColor}25`,
          border: `1px solid ${subColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20
        }}>📖</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {s.subject.code}
              </span>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>
                {s.subject.name}
              </h3>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>
              {pct}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'STUDENTS', value: s.totalStudents, color: '#14b8a6' },
          { label: 'CLASSES', value: s.totalClasses, color: '#7c3aed' },
          { label: 'AVG RATE', value: `${pct}%`, color },
        ].map(item => (
          <div key={item.label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', textAlign: 'center'
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '0.05em' }}>{item.label}</p>
            <p style={{ fontWeight: 700, color: item.color, fontSize: 16, fontFamily: 'var(--font-display)' }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${subColor}80, ${subColor})`
        }} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {s.recentSessions?.length > 0
            ? `Last class: ${new Date(s.recentSessions[0].date).toLocaleDateString('en-IN')}`
            : 'No classes yet'}
        </span>
        <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>View Details →</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, color }}>{value}</span>
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
