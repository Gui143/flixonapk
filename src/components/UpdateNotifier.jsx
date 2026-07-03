import { useEffect, useState } from 'react';
import { winControl, openExternal } from '../lib/winControl';

// Notificação de atualização disponível (canto inferior direito).
// Aparece quando o processo principal detecta uma versão mais nova publicada.
export default function UpdateNotifier() {
  const [info, setInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    winControl.onUpdateAvailable?.((updateInfo) => {
      setInfo(updateInfo);
    });
  }, []);

  if (!info || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[90] w-80 animate-slide-up">
      <div className="bg-flixon-card border border-flixon-violet/50 rounded-xl p-4 shadow-glow">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-flixon-violet/20 flex items-center justify-center shrink-0 text-lg">
            ⬇️
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">
              Atualização disponível {info.version && `v${info.version}`}
            </div>
            <p className="text-flixon-muted text-xs mt-0.5">
              {info.notes || 'Há uma nova versão do FlixOn com melhorias e correções.'}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-flixon-muted hover:text-white text-lg leading-none shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {info.url ? (
            <button
              onClick={() => openExternal(info.url)}
              className="flex-1 px-3 py-2 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light text-sm font-semibold transition-colors"
            >
              Baixar agora
            </button>
          ) : (
            <span className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-flixon-muted text-xs text-center">
              Link de download indisponível
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
