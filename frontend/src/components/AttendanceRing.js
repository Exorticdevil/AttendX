'use client';

export default function AttendanceRing({ percentage, size = 120, strokeWidth = 10, label = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 75
    ? '#10b981'
    : percentage >= 60
      ? '#f59e0b'
      : '#f43f5e';

  const glowColor = percentage >= 75
    ? 'rgba(16,185,129,0.3)'
    : percentage >= 60
      ? 'rgba(245,158,11,0.3)'
      : 'rgba(244,63,94,0.3)';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <filter id={`glow-${percentage}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 6px ${glowColor})`
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: size > 100 ? 22 : 16,
          fontWeight: 800,
          color,
          lineHeight: 1
        }}>
          {percentage}%
        </span>
        {label && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
        )}
      </div>
    </div>
  );
}
