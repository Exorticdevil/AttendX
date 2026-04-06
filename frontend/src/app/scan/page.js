'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';

export default function QRScannerPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true); 
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setErrorMsg("Camera access denied. Please allow camera permissions in your browser settings.");
      }
    };
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const tick = () => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // SUCCESS: Redirect to your verification page with the session ID from the QR
        // We use /student/verify because that is where your attendance logic lives
        router.push(`/student/verify?session=${encodeURIComponent(code.data)}`);
        return;
      }
    }
    requestAnimationFrame(tick);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed' }}>AttendX Scanner</h1>
        <p style={{ color: '#94a3b8' }}>Point camera at the Teacher's QR code</p>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', border: '2px solid #7c3aed', boxShadow: '0 0 30px rgba(124,58,237,0.2)' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {/* The Animated Scan Line */}
        <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: '#7c3aed', boxShadow: '0 0 15px #7c3aed', animation: 'scanline 2.5s infinite ease-in-out' }} />
      </div>

      {errorMsg && <p style={{ marginTop: '20px', color: '#f43f5e', textAlign: 'center' }}>{errorMsg}</p>}

      <style>{`
        @keyframes scanline { 0%, 100% { transform: translateY(-130px); } 50% { transform: translateY(130px); } }
      `}</style>
    </div>
  );
}
