'use client';
import { usePathname, useRouter } from 'next/navigation';
// FIXED: Changed from '../../' to '../' to correctly reach the context folder
import { useAuth } from '../context/AuthContext';

const STUDENT_NAV = [
  { href: '/student/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/student/attendance', label: 'Attendance History', icon: '📋' },
  { href: '/scan', label: 'Scan QR Code', icon: '⬡' },
];

const TEACHER_NAV = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/teacher/subjects', label: 'My Subjects', icon: '📚' },
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const pathname = usePathname();
  const nav = user?.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;

  // Generate initials for the avatar
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
      {/* Logo */}
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
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
          letterSpacing: '-0.02em'
        }}>
          <span className="gradient-text">AttendX</span>
        </span>
      </div>

      {/* Role badge */}
      <div style={{ marginBottom: 24, paddingLeft: 4 }}>
        <span className={`badge ${user?.role === 'teacher' ? 'badge-violet' : 'badge-green'}`}>
          {user?.role === 'teacher' ? '🧑‍🏫 Teacher' : '🎓 Student'}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          paddingLeft: 14, marginBottom: 8
        }}>Navigation</p>
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div style={{
        marginTop: 'auto', paddingTop: 20,
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 14px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logoutUser}
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13, cursor: 'pointer' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}