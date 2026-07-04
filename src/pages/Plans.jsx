import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { sanitizeText } from '../lib/security';

export default function Plans() {
  const { plans, userPlan, subscribePlan, planInfo } = useAppData();
  const { isAdmin } = useAuth();
  const [msg, setMsg] = useState('');

  const subscribe = async (plan) => {
    setMsg('');
    const res = await subscribePlan(plan.id);
    if (!res.ok) {
      setMsg(res.error || 'Erro ao assinar.');
    } else {
      setMsg(`✓ Plano ${plan.name} ativado!`);
    }
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold mb-2">Escolha seu plano</h1>
        <p className="text-flixon-muted">Assista sem limites. Cancele quando quiser.</p>
        {planInfo?.active && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            ✓ Plano ativo: <strong>{planInfo.name}</strong>
            {planInfo.daysLeft > 0 && ` • ${planInfo.daysLeft} dia(s) restante(s)`}
          </div>
        )}
      </div>

      {msg && (
        <div className="max-w-md mx-auto mb-6 text-sm text-center px-4 py-3 rounded-lg bg-flixon-violet/10 border border-flixon-violet/30 text-flixon-violet-light">
          {msg}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const active = userPlan === plan.id;
          const isTrial = plan.id === 'basic';
          return (
            <div key={plan.id} className={'relative rounded-2xl p-6 border transition-all flex flex-col ' +
              (plan.highlight ? 'border-flixon-violet bg-gradient-to-b from-flixon-violet/15 to-flixon-card shadow-glow' : 'border-flixon-border bg-flixon-card')}>
              {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-flixon-violet text-xs font-bold">MAIS POPULAR</span>}
              {isTrial && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-xs font-bold">GRÁTIS</span>}
              <h3 className="text-xl font-bold">{sanitizeText(plan.name)}</h3>
              <div className="my-4">
                <span className="text-4xl font-extrabold">
                  {plan.price === 0 ? 'Grátis' : `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`}
                </span>
                <span className="text-flixon-muted text-sm">{plan.period}</span>
              </div>
              <div className="text-flixon-violet-light font-semibold text-sm mb-4">{sanitizeText(plan.quality)} • {plan.devices} tela(s)</div>
              <ul className="space-y-2 text-sm text-flixon-muted mb-6 flex-1">
                {plan.features.map((f, i) => (<li key={i} className="flex items-start gap-2"><span className="text-flixon-violet-light mt-0.5">✓</span><span>{sanitizeText(f)}</span></li>))}
              </ul>
              <button onClick={() => subscribe(plan)} disabled={active || (isAdmin)}
                className={'w-full py-3 rounded-lg font-semibold transition-colors ' +
                  (active ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 cursor-default' :
                   plan.highlight ? 'bg-flixon-violet hover:bg-flixon-violet-light shadow-glow' :
                   isTrial ? 'bg-emerald-600 hover:bg-emerald-500' :
                   'bg-white/10 hover:bg-white/20')}>
                {active ? '✓ Plano ativo' : isTrial ? '🎬 Iniciar teste grátis' : 'Assinar'}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-flixon-muted text-xs mt-10">Pagamentos simulados para demonstração. O teste de 7 dias só pode ser usado uma vez por conta.</p>
    </div>
  );
}
