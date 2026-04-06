'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { getStudentDashboard, getAttendanceHistory } from '../../../lib/api';

export default function StudentAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user?.role !== 'student') router.push('/teacher/dashboard');
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.role === 'student') {
      Promise.all([
        getStudentDashboard(),
        getAttendanceHistory()
      ]).then(([dash, hist]) => {
        setDashboard(dash.data);
        setHistory(hist.data.records);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filteredHistory = selectedSubject === 'all'
    ? history
    : history.filter(r => r.subject?._id === selectedSubject);

  if (authLoading || loading) return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 240, background: 'rgba(10,10,20,0.8)', borderRight: '1px solid var(--border)' }} />
      <main style={{ flex: 1, padding: 32 }}>
        <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 500 }} />
      </main>
    </div>
  );

  const subjects = dashboard?.subjects || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div className="animate-fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Attendance History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Complete record of your class attendance
          </p>
        </div>

        {/* Subject filter */}
        <div className="animate-fade-up stagger-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={() => setSelectedSubject('all')}
            className={selectedSubject === 'all' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >All Subjects</button>
          {subjects.map(s => (
            <button
              key={s.subject._id}
              onClick={() => setSelectedSubject(s.subject._id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, border: '1px solid',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                background: selectedSubject === s.subject._id ? `${s.subject.color}20` : 'transparent',
                borderColor: selectedSubject === s.subject._id ? s.subject.color : 'var(--border)',
                color: selectedSubject === s.subject._id ? s.subject.color : 'var(--text-secondary)'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.subject.color }} />
              {s.subject.code}
            </button>
          ))}
        </div>

        {/* Summary row */}
        {selectedSubject !== 'all' && (() => {
          const subj = subjects.find(s => s.subject._id === selectedSubject);
          if (!subj) return null;
          return (
            <div className="glass-card animate-fade-up stagger-2" style={{
              padding: 20, marginBottom: 20,
              display: 'flex', gap: 24, alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: subj.subject.color }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{subj.subject.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({subj.subject.code})</span>
              </div>
              <div style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>{subj.attended}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ATTENDED</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)' }}>{subj.absent}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ABSENT</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)',
                    color: subj.percentage >= 75 ? '#10b981' : '#f43f5e' }}>{subj.percentage}%</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>RATE</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* History table */}
        <div className="glass-card animate-fade-up stagger-2">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                Attendance Records
              </h2>
              <span className="badge badge-violet">{filteredHistory.length} records</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
                      No attendance records found
                    </td>
                  </tr>
                ) : filteredHistory.map((record, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {new Date(record.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(record.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {record.subject?.name}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: record.subject?.color || '#7c3aed' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                          {record.subject?.code}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${record.status === 'present' ? 'badge-green' : record.status === 'late' ? 'badge-amber' : 'badge-red'}`}>
                        {record.status === 'present' ? '✓ Present' : record.status === 'late' ? '⏱ Late' : '✕ Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
