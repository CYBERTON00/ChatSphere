import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'video' | 'logo' | 'done'>('video');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('logo'), 2500);
    const timer2 = setTimeout(() => { setPhase('done'); onComplete(); }, 4000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]">
      {phase === 'video' && (
        <video
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          onEnded={() => setPhase('logo')}
        >
          <source src="/loading.mp4" type="video/mp4" />
        </video>
      )}
      {phase === 'logo' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" rx="40" fill="#2a2520"/>
            <g transform="translate(30, 40)">
              <rect x="0" y="20" width="20" height="100" rx="3" fill="#5a5040"/>
              <path d="M65 30 C40 30, 30 50, 30 70 C30 90, 40 110, 65 110" stroke="#e8e0d0" stroke-width="18" stroke-linecap="round" fill="none"/>
              <path d="M90 110 L115 30 L140 110" stroke="#e8e0d0" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <line x1="98" y1="85" x2="132" y2="85" stroke="#e8e0d0" stroke-width="14" stroke-linecap="round"/>
            </g>
          </svg>
          <h1 className="text-2xl font-bold text-[#e8e0d0] tracking-wider">ChatSphere</h1>
          <div className="w-32 h-1 bg-[#e8e0d0]/20 rounded-full overflow-hidden">
            <div className="h-full bg-[#e8e0d0] rounded-full animate-loading-bar" />
          </div>
        </div>
      )}
    </div>
  );
}
