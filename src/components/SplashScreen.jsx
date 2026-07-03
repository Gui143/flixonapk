import { useEffect, useState } from 'react';

// SplashScreen: loading inicial do app.
// Mostra o ícone de "play" roxo girando em 3D (rotateY).
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Esconde após o React montar a primeira tela
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-flixon-bg transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Play roxo girando em 3D */}
      <div
        className="mb-6"
        style={{ perspective: '600px' }}
      >
        <div
          className="rounded-xl flex items-center justify-center shadow-glow"
          style={{
            width: 72,
            height: 72,
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            animation: 'flixon-spin3d 1.2s ease-in-out infinite'
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <span className="text-2xl font-extrabold tracking-tight">FlixOn</span>
      <span className="text-flixon-muted text-xs mt-1">Carregando...</span>

      {/* CSS da animação 3D injetado inline */}
      <style>{`
        @keyframes flixon-spin3d {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(180deg) scale(1.05); }
          100% { transform: rotateY(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
