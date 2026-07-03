import { useAppData } from '../context/AppDataContext';
import { sanitizeText } from '../lib/security';

export default function Plans() {
  const { plans, userPlan, subscribePlan } = useAppData();

  const subscribe = (plan) => {
    subscribePlan(plan.id);
  };

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Escolha seu plano</h1>
        <p className="text-flixon-muted">Assista sem limites. Cancele quando quiser.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const active = userPlan === plan.id;
          return (
            <div key={plan.id} className={'relative rounded-2xl p-6 border transition-all flex flex-col ' +
              (plan.highlight ? 'border-flixon-violet bg-gradient-to-b from-flixon-violet/15 to-flixon-card shadow-glow' : 'border-flixon-border bg-flixon-card')}>
              {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-flixon-violet text-xs font-bold">MAIS POPULAR</span>}
              <h3 className="text-xl font-bold">{sanitizeText(plan.name)}</h3>
              <div className="my-4">
                <span className="text-4xl font-extrabold">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                <span className="text-flixon-muted text-sm">{plan.period}</span>
              </div>
              <div className="text-flixon-violet-light font-semibold text-sm mb-4">{sanitizeText(plan.quality)} • {plan.devices} tela(s)</div>
              <ul className="space-y-2 text-sm text-flixon-muted mb-6 flex-1">
                {plan.features.map((f, i) => (<li key={i} className="flex items-start gap-2"><span className="text-flixon-violet-light mt-0.5">✓</span><span>{sanitizeText(f)}</span></li>))}
              </ul>
              <button onClick={() => subscribe(plan)} disabled={active}
                className={'w-full py-3 rounded-lg font-semibold transition-colors ' +
                  (active ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 cursor-default' : plan.highlight ? 'bg-flixon-violet hover:bg-flixon-violet-light shadow-glow' : 'bg-white/10 hover:bg-white/20')}>
                {active ? '✓ Plano ativo' : 'Assinar'}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-flixon-muted text-xs mt-10">Pagamentos simulados para demonstração.</p>
    </div>
  );
}
