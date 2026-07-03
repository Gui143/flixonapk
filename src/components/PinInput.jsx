import { useState } from 'react';
import { verifyPin } from '../lib/profiles';

// Entrada de PIN de 4 dígitos (estilo Netflix)
export default function PinInput({ profile, onCorrect, onCancel }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);

  const press = async (n) => {
    setError(false);
    const next = [...digits];
    const emptyIdx = next.findIndex((d) => d === '');
    if (emptyIdx === -1) return;
    next[emptyIdx] = String(n);
    setDigits(next);

    // quando completar 4 dígitos, valida
    if (emptyIdx === 3) {
      const pin = next.join('');
      const ok = await verifyPin(pin, profile.pin);
      if (ok) {
        onCorrect();
      } else {
        setError(true);
        setTimeout(() => setDigits(['', '', '', '']), 600);
      }
    }
  };

  const del = () => {
    setError(false);
    const next = [...digits];
    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i] !== '') {
        next[i] = '';
        break;
      }
    }
    setDigits(next);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Perfil protegido</h2>
      <p className="text-flixon-muted mb-6">Digite o PIN de {profile.nome}</p>

      {/* Caixas dos dígitos */}
      <div className={'flex gap-3 mb-8 ' + (error ? 'animate-pulse' : '')}>
        {digits.map((d, i) => (
          <div
            key={i}
            className={
              'w-14 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-colors ' +
              (error
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : d
                ? 'border-flixon-violet bg-flixon-violet/10 text-white'
                : 'border-flixon-border bg-flixon-card text-flixon-muted')
            }
          >
            {d ? '●' : ''}
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">PIN incorreto. Tente novamente.</p>}

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3 max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => press(n)}
            className="w-20 h-20 rounded-full bg-flixon-card border border-flixon-border hover:bg-flixon-violet hover:border-flixon-violet text-2xl font-bold transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={onCancel}
          className="w-20 h-20 rounded-full text-sm font-semibold text-flixon-muted hover:text-white"
        >
          Cancelar
        </button>
        <button
          onClick={() => press(0)}
          className="w-20 h-20 rounded-full bg-flixon-card border border-flixon-border hover:bg-flixon-violet hover:border-flixon-violet text-2xl font-bold transition-colors"
        >
          0
        </button>
        <button
          onClick={del}
          className="w-20 h-20 rounded-full bg-flixon-card border border-flixon-border hover:bg-flixon-card-hover text-xl font-bold transition-colors"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
