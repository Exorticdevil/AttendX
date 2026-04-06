'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else if (user.role === 'teacher') router.push('/teacher/dashboard');
      else router.push('/student/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid rgba(139,92,246,0.3)',
          borderTopColor: '#7c3aed', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
