'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const STUDENT_NAV = [
  { href: '/student/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/student/attendance', label: 'Attendance History', icon: '📋' },
  { href: '/student/scan', label: 'Scan QR Code', icon: '⬡' }, // Updated Path
];

const TEACHER_NAV = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: '⊞' }
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const pathname = usePathname();
  const nav = user?.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <aside style={{
      width: 240, minHeight: '100vh', flexShrink: 0,
      background: 'rgba(10,10,20,0.8)',
      borderRight: '1px solid var(--border)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      position: 'sticky', top: 0, height: '100vh', overflow: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, paddingLeft: 4 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(124,58,237,0.3)'
        }}>
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="10" height="10" rx="2" fill="white" opacity="0.9"/>
            <rect x="18" y="4" width="10" height="10" rx="2" fill="white" opacity="0.6"/>
            <rect x="4" y="18" width="10" height="10" rx="2" fill="white" opacity="0.6"/>
            <rect x="20" y="20" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span className="gradient-text">AttendX</span>
        </span>
      </div>

      <nav style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: 14, marginBottom: 8 }}>Navigation</p>
        {nav.map((item) => (
          <a key={item.href} href={item.href} className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}>
            <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
          </a>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <button onClick={logoutUser} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
