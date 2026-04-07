'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import api from '../../lib/api';

function getDeviceFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();
    const raw = canvasData + navigator.hardwareConcurrency + screen.width + screen.height + navigator.language;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return 'fallback-' + Math.random().toString(36).slice(2);
  }
}

export default function QRScannerPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanningRef = useRef(true);

  const [status, setStatus] = useState('scanning'); // scanning | locating | submitting | success | error
  const [message, setMessage] = useState('');
  const [attendanceResult, setAttendanceResult] = useState(null);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch {
        setStatus('error');
        setMessage('Camera access denied. Please allow camera permissions.');
      }
    };

    startCamera();

    return () => {
      scanningRef.current = false;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const tick = useCallback(() => {
    if (!scanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        scanningRef.current = false;
        handleQRDetected(code.data);
        return;
      }
    }

    requestAnimationFrame(tick);
  }, []);

  const handleQRDetected = async (qrData) => {
    // Stop camera
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());

    setStatus('locating');
    setMessage('Getting your location...');

    // Extract sessionId from QR data
    // QR data could be a URL like https://yourapp.com/scan?session=abc123
    // or just the raw sessionId string
    let sessionId = qrData;
    try {
      const url = new URL(qrData);
      sessionId = url.searchParams.get('session') || qrData;
    } catch {
      // not a URL, use raw value
    }

    // Get GPS location
    let latitude, longitude;
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    } catch {
      setStatus('error');
      setMessage('Location access denied. Please enable GPS and try again.');
      return;
    }

    // Get device fingerprint
    const deviceFingerprint = getDeviceFingerprint();

    // Submit attendance
    setStatus('submitting');
    setMessage('Marking your attendance...');

    try {
      const res = await api.post('/attendance/mark', {
        sessionId,
        latitude,
        longitude,
        deviceFingerprint
      });

      setStatus('success');
      setAttendanceResult(res.data.attendance);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to mark attendance. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a14',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 30, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginBottom: 6 }}>
          AttendX Scanner
        </h1>
        <p style={{ color: '#94a3b8' }}>
          {status === 'scanning' ? "Point camera at teacher's QR code" : ''}
        </p>
      </div>

      {/* Camera — only show while scanning */}
      {status === 'scanning' && (
        <div style={{
          position: 'relative', width: '100%', maxWidth: 400,
          aspectRatio: '1/1', borderRadius: 24, overflow: 'hidden',
          border: '2px solid #7c3aed',
          boxShadow: '0 0 30px rgba(124,58,237,0.2)'
        }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{
            position: 'absolute', top: '50%', left: '10%', right: '10%',
            height: 2, background: '#7c3aed',
            boxShadow: '0 0 15px #7c3aed',
            animation: 'scanline 2.5s infinite ease-in-out'
          }} />
        </div>
      )}

      {/* Locating / Submitting spinner */}
      {(status === 'locating' || status === 'submitting') && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20, marginTop: 40
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTop: '3px solid #7c3aed',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#94a3b8', fontSize: 16 }}>{message}</p>
        </div>
      )}

      {/* Success */}
      {status === 'success' && attendanceResult && (
        <div style={{
          marginTop: 20, width: '100%', maxWidth: 400,
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 20, padding: 32, textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginBottom: 8 }}>
            Attendance Marked!
          </h2>
          <p style={{ color: '#6ee7b7', fontSize: 16, marginBottom: 24 }}>
            {attendanceResult.subject}
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left'
          }}>
            <Row label="Date" value={new Date(attendanceResult.date).toLocaleDateString('en-IN')} />
            <Row label="Time" value={new Date(attendanceResult.date).toLocaleTimeString('en-IN')} />
            <Row label="Status" value="Present ✓" color="#10b981" />
            <Row label="Distance" value={`${attendanceResult.distance}m from classroom`} />
          </div>
          <button
            onClick={() => router.push('/student/dashboard')}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #7c3aed, #14b8a6)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{
          marginTop: 20, width: '100%', maxWidth: 400,
          background: 'rgba(244,63,94,0.1)',
          border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: 20, padding: 32, textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f43f5e', marginBottom: 8 }}>
            Failed
          </h2>
          <p style={{ color: '#fda4af', fontSize: 15, marginBottom: 24 }}>{message}</p>
          <button
            onClick={() => {
              setStatus('scanning');
              setMessage('');
              scanningRef.current = true;
              // restart camera
              navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    requestAnimationFrame(tick);
                  }
                });
            }}
            style={{
              width: '100%', padding: 14, marginBottom: 12,
              background: 'linear-gradient(135deg, #7c3aed, #14b8a6)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/student/dashboard')}
            style={{
              width: '100%', padding: 14,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, color: '#94a3b8',
              fontSize: 15, cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-130px); }
          50% { transform: translateY(130px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
      <span style={{ color: color || '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
