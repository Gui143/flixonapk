import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { winControl } from '../lib/winControl';
import { APP_NAME } from '../config';
import Logo from './Logo';

// Titlebar customizada (sem a barra nativa do Windows).
// A área central é "arrastável" (drag); os botões e o logo são no-drag.
export default function Titlebar() {
  const [max, setMax] = useState(false);

  useEffect(() => {
    winControl.onMaximizeChange?.(setMax);
    winControl.isMaximized().then(setMax);
  }, []);

  const btn =
    'no-drag w-11 h-9 flex items-center justify-center text-flixon-muted hover:bg-white/10 hover:text-white transition-colors';

  return (
    <div className="titlebar-drag flex items-center justify-between h-9 bg-flixon-bg border-b border-flixon-border shrink-0 z-50">
      <Link to="/" className="no-drag flex items-center gap-2 pl-3">
        <Logo size={20} />
        <span className="font-extrabold tracking-tight text-sm">{APP_NAME}</span>
      </Link>

      <div className="text-flixon-muted text-[11px] hidden sm:block">
        Premium Streaming
      </div>

      <div className="no-drag flex items-center">
        <button onClick={winControl.minimize} className={btn} title="Minimizar">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5.5" width="12" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={winControl.toggleMaximize}
          className={btn}
          title="Maximizar"
        >
          {max ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2.5" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1" />
              <rect x="1" y="2.5" width="7" height="7" fill="var(--tw-shadow-color, #0a0a0a)" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          onClick={winControl.close}
          className="no-drag w-11 h-9 flex items-center justify-center text-flixon-muted hover:bg-red-600 hover:text-white transition-colors"
          title="Fechar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
