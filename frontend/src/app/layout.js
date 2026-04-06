import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'AttendX — Smart QR Attendance',
  description: 'Modern QR-based attendance management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <div className="bg-orbs">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-orb bg-orb-3" />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
