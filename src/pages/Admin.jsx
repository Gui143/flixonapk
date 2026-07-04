import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAppData,
  CATEGORIES,
  categoryLabel
} from '../context/AppDataContext';
import { supabase } from '../lib/supabase';
import {
  isSafeEmbedUrl,
  isLikelyPhishingUrl,
  sanitizeText
} from '../lib/security';
import { searchTmdb, tmdbEnabled } from '../lib/tmdb';
import { describeSource } from '../lib/embed';
import { AGE_RATINGS } from '../components/AgeRating';
import { ADMIN_EMAIL } from '../config';

const TABS = [
  { id: 'content', label: 'Conteúdo' },
  { id: 'profiles', label: 'Usuários' },
  { id: 'plans', label: 'Planos' }
];

const emptyForm = {
  title: '', type: 'movie', poster: '', backdrop: '', year: '', rating: '',
  genres: '', overview: '', source: 'embed', url: '', seriesMode: 'simple',
  featured: false, upcoming: false, ageRating: '', isTrending: true
};

export default function Admin() {
  const [tab, setTab] = useState('content');
  const [params, setParams] = useSearchParams();
  const editingId = params.get('edit');

  useEffect(() => { if (editingId) setTab('content'); }, [editingId]);

  const { library } = useAppData();

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-3xl font-extrabold">Painel Admin</h1>
        <span className="px-2 py-0.5 rounded-full bg-flixon-violet/20 border border-flixon-violet/50 text-flixon-violet-light text-xs font-semibold">
          {ADMIN_EMAIL}
        </span>
      </div>
      <p className="text-flixon-muted mb-6">Gerencie conteúdo no servidor (Supabase).</p>

      <div className="flex gap-2 mb-6 border-b border-flixon-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ' +
              (tab === t.id ? 'border-flixon-violet text-white' : 'border-transparent text-flixon-muted hover:text-white')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <ContentManager content={library} editingId={editingId}
          onEdit={(cid) => setParams({ edit: cid })}
          onDoneEditing={() => setParams({})} />
      )}
      {tab === 'profiles' && <Profiles />}
      {tab === 'plans' && <PlansManager />}
    </div>
  );
}

function ContentManager({ content, editingId, onEdit, onDoneEditing }) {
  const {
    addContent, updateContent, removeContent, getContentById,
    addSeason, updateSeason, removeSeason, addEpisode, updateEpisode, removeEpisode
  } = useAppData();

  const editing = editingId ? getContentById(editingId) : null;
  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [tmdbQ, setTmdbQ] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [previewId, setPreviewId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      const hasEmbed = !!editing.embedUrl;
      setForm({
        title: editing.title || '', type: editing.type || 'movie',
        poster: editing.poster || '', backdrop: editing.backdrop || '',
        year: editing.year || '', rating: editing.rating || '',
        genres: (editing.genres || []).join(', '), overview: editing.overview || '',
        source: hasEmbed ? 'embed' : 'link', url: editing.embedUrl || editing.videoUrl || '',
        seriesMode: editing.seriesMode || 'simple',
        featured: !!editing.featured, upcoming: !!editing.upcoming,
        ageRating: editing.ageRating || '', isTrending: editing.isTrending !== false
      });
    } else { setForm(emptyForm); }
    setErr(''); setOk('');
  }, [editingId]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isSeries = form.type === 'tv' || form.type === 'anime';
  const isChannel = form.type === 'channel';

  const doTmdbSearch = async () => setTmdbResults(await searchTmdb(tmdbQ));
  const fillFromTmdb = (r) => {
    setForm((f) => ({ ...f, title: r.title, type: r.type === 'tv' ? 'tv' : f.type,
      poster: r.poster || f.poster, backdrop: r.backdrop || f.backdrop,
      year: r.year || f.year, rating: r.rating || f.rating, overview: r.overview || f.overview }));
    setTmdbResults([]); setTmdbQ('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setOk('');
    if (!form.title.trim()) return setErr('Informe o título.');

    const payload = {
      title: form.title.trim(), type: form.type,
      poster: form.poster.trim(), backdrop: form.backdrop.trim(),
      year: form.year.trim(), rating: form.rating.trim(),
      genres: form.genres.split(',').map((g) => g.trim()).filter(Boolean),
      overview: form.overview.trim(),
      featured: !!form.featured, upcoming: !!form.upcoming,
      isTrending: !!form.isTrending,
      seriesMode: isSeries ? form.seriesMode : 'simple',
      ageRating: form.ageRating || ''
    };

    const needsHeaderSource = !isSeries || (isSeries && form.seriesMode === 'simple');
    if (needsHeaderSource) {
      const url = form.url.trim();
      if (url) {
        if (isLikelyPhishingUrl(url)) return setErr('URL bloqueada: domínio suspeito.');
        if (form.source === 'embed' && !isSafeEmbedUrl(url)) return setErr('Embed inválido.');
        if (form.source === 'link' && !/^https:\/\/.+/i.test(url)) return setErr('Link inválido.');
        payload.embedUrl = form.source === 'embed' ? url : '';
        payload.videoUrl = form.source === 'link' ? url : '';
      }
    }
    if (isSeries && form.seriesMode === 'advanced') {
      payload.embedUrl = ''; payload.videoUrl = '';
    }

    setSaving(true);
    if (editing) {
      await updateContent(editing.id, payload);
      setOk('Conteúdo atualizado! ✓');
    } else {
      await addContent(payload);
      setOk('Conteúdo adicionado ao catálogo! ✓');
      setForm(emptyForm);
    }
    setSaving(false);
    setTimeout(() => setOk(''), 3000);
  };

  const cancelEdit = () => { setForm(emptyForm); onDoneEditing(); };

  return (
    <div className="max-w-3xl">
      <div className="bg-flixon-card border border-flixon-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold">
            {editing ? `✏️ Editar: ${sanitizeText(editing.title)}` : '➕ Adicionar conteúdo'}
          </h2>
          {editing && (
            <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 font-semibold">
              + Novo conteúdo
            </button>
          )}
        </div>

        {!isChannel && (tmdbEnabled ? (
          <div className="mb-4 p-3 rounded-lg bg-flixon-bg border border-flixon-border">
            <div className="text-xs text-flixon-muted mb-2">✨ Autopreencher via TMDB</div>
            <div className="flex gap-2">
              <input value={tmdbQ} onChange={(e) => setTmdbQ(e.target.value)} placeholder="Buscar..."
                className="flex-1 px-3 py-2 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm" />
              <button onClick={doTmdbSearch} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold">Buscar</button>
            </div>
            {tmdbResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {tmdbResults.map((r) => (
                  <button key={r.tmdbId} onClick={() => fillFromTmdb(r)} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 text-left text-sm">
                    {r.poster && <img src={r.poster} alt="" className="w-8 h-12 object-cover rounded" />}
                    <span className="flex-1 truncate">{r.title} <span className="text-flixon-muted">({r.year || '—'})</span></span>
                    <span className="text-xs text-flixon-violet-light">usar →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 text-xs text-flixon-muted">💡 Configure a chave TMDB para autopreencher.</div>
        ))}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Título *">
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Interestelar" className={inputCls} />
            </Field>
            <Field label="Categoria *">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => (<option key={c.id} value={c.id} className="bg-flixon-card">{c.label}</option>))}
              </select>
            </Field>
          </div>

          <Field label="URL do Backdrop (cena de fundo)">
            <input value={form.backdrop} onChange={(e) => set('backdrop', e.target.value)} placeholder="https://...jpg" className={inputCls} />
          </Field>

          <div className={`grid gap-3 ${isChannel ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <Field label="Ano"><input value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="2014" className={inputCls} /></Field>
            <Field label="Nota (0-10)"><input value={form.rating} onChange={(e) => set('rating', e.target.value)} placeholder="8.6" className={inputCls} /></Field>
            {!isChannel && (
              <Field label="Gêneros (vírgula)"><input value={form.genres} onChange={(e) => set('genres', e.target.value)} placeholder="Ficção, Drama" className={inputCls} /></Field>
            )}
          </div>

          {(!isSeries || (isSeries && form.seriesMode === 'simple')) && !isChannel && (
            <label className="flex items-center gap-4 cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Toggle checked={form.featured} onChange={(v) => set('featured', v)} />
                <span className="text-sm font-medium">⭐ Destaque</span>
              </span>
              <span className="flex items-center gap-2">
                <Toggle checked={form.isTrending} onChange={(v) => set('isTrending', v)} />
                <span className="text-sm font-medium">🔥 Em Alta</span>
              </span>
            </label>
          )}

          <Field label="Classificação Indicativa">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => set('ageRating', '')}
                className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' +
                  (!form.ageRating ? 'bg-flixon-violet/15 border-flixon-violet text-white' : 'bg-flixon-bg border border-flixon-border text-flixon-muted hover:text-white')}>
                Nenhuma
              </button>
              {AGE_RATINGS.map((ar) => {
                const colors = { L: '#00A859', '10': '#00AEEF', '12': '#FFF200', '14': '#F26522', '16': '#ED1C24', '18': '#000000' };
                const isSel = form.ageRating === ar;
                return (
                  <button key={ar} type="button" onClick={() => set('ageRating', ar)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 transition-all ' +
                      (isSel ? 'ring-2 ring-flixon-violet scale-105' : 'opacity-70 hover:opacity-100')}
                    style={{ backgroundColor: colors[ar], color: ar === '12' || ar === '10' ? '#000' : '#fff', borderColor: colors[ar], outline: ar === '18' ? '1px solid #333' : 'none' }}>
                    {ar}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Sinopse">
            <textarea value={form.overview} onChange={(e) => set('overview', e.target.value)} rows={3} placeholder="Descrição..." className={inputCls} />
          </Field>

          {isSeries && (
            <Field label="Modo da Série">
              <select value={form.seriesMode} onChange={(e) => set('seriesMode', e.target.value)} className={inputCls}>
                <option value="simple" className="bg-flixon-card">Simples (um único embed)</option>
                <option value="advanced" className="bg-flixon-card">Avançado (temporadas e episódios)</option>
              </select>
            </Field>
          )}

          {(!isSeries || form.seriesMode === 'simple') && (
            <>
              {!isChannel && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-flixon-bg border border-flixon-border">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">🗓️ Adicionar em "Em Breve"</div>
                    <p className="text-xs text-flixon-muted">Quando ativo, não aparece no catálogo normal — só na página Em Breve.</p>
                  </div>
                  <Toggle checked={form.upcoming} onChange={(v) => set('upcoming', v)} />
                </div>
              )}
              <Field label="URL do Poster">
                <input value={form.poster} onChange={(e) => set('poster', e.target.value)} placeholder="https://..." className={inputCls} />
              </Field>
              <Field label="URL ou Código Embed do Vídeo *">
                <div className="flex flex-wrap gap-2 mb-2">
                  <SourceBtn active={form.source === 'embed'} onClick={() => set('source', 'embed')}>📺 Embed (URL ou &lt;iframe&gt;)</SourceBtn>
                  <SourceBtn active={form.source === 'link'} onClick={() => set('source', 'link')}>🔗 Link direto (.mp4, .m3u8)</SourceBtn>
                </div>
                <input value={form.url} onChange={(e) => set('url', e.target.value)}
                  placeholder={form.source === 'embed' ? 'Cole uma URL ou um código <iframe...' : 'https://exemplo.com/filme.mp4'} className={inputCls} />
              </Field>
            </>
          )}

          {isSeries && form.seriesMode === 'advanced' && (
            <div className="p-3 rounded-lg bg-flixon-bg border border-flixon-violet/30 space-y-3">
              <Field label="URL do Poster">
                <input value={form.poster} onChange={(e) => set('poster', e.target.value)} placeholder="https://..." className={inputCls} />
              </Field>
              {form.poster && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-flixon-muted">Prévia:</span>
                  <img src={form.poster} alt="" className="w-16 h-24 object-cover rounded border border-flixon-border" onError={(e) => (e.target.style.display = 'none')} />
                </div>
              )}
              {editing ? (
                <SeasonsEditor content={editing} addSeason={addSeason} updateSeason={updateSeason}
                  removeSeason={removeSeason} addEpisode={addEpisode} updateEpisode={updateEpisode} removeEpisode={removeEpisode} />
              ) : (
                <p className="text-sm text-flixon-muted text-center py-4">💡 Salve o conteúdo primeiro, depois adicione temporadas e episódios.</p>
              )}
            </div>
          )}

          {form.poster && form.seriesMode !== 'advanced' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-flixon-muted">Prévia da capa:</span>
              <img src={form.poster} alt="" className="w-16 h-24 object-cover rounded border border-flixon-border" onError={(e) => (e.target.style.display = 'none')} />
            </div>
          )}

          {err && <ErrorBox>{err}</ErrorBox>}
          {ok && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">{ok}</div>}

          <div className="flex gap-2">
            <button disabled={saving} className="px-5 py-2.5 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light disabled:opacity-60 font-semibold transition-colors">
              {saving ? 'Salvando...' : editing ? '💾 Salvar alterações' : '➕ Adicionar ao catálogo'}
            </button>
            {editing && <button type="button" onClick={cancelEdit} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 font-semibold">Cancelar</button>}
          </div>
        </form>
      </div>

      {/* Lista de conteúdo */}
      <h2 className="text-lg font-bold mb-3">Conteúdo cadastrado ({content.length})</h2>
      {content.length === 0 ? (
        <p className="text-flixon-muted">Nenhum conteúdo ainda.</p>
      ) : (
        <div className="space-y-3">
          {content.map((c) => {
            const eps = (c.seasons || []).reduce((a, s) => a + (s.episodes?.length || 0), 0);
            return (
              <div key={c.id} className="bg-flixon-card border border-flixon-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {c.poster ? (
                    <img src={c.poster} alt="" className="w-12 h-16 object-cover rounded shrink-0" onError={(e) => (e.target.style.opacity = 0)} />
                  ) : (<div className="w-12 h-16 bg-flixon-bg rounded shrink-0" />)}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-2 flex-wrap">
                      {sanitizeText(c.title)}
                      {c.featured && <span className="text-[10px] text-flixon-violet-light">★ Destaque</span>}
                      {c.isTrending ? <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">🔥 Em Alta</span> : null}
                      {c.upcoming && <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Em Breve</span>}
                    </div>
                    <div className="text-xs text-flixon-muted">
                      {categoryLabel(c.type)} {c.year && `• ${c.year}`} {c.rating && `• ★ ${c.rating}`} {eps > 0 && ` • ${eps} ep.`}
                    </div>
                    <div className="text-xs text-flixon-muted truncate">{describeSource(c)}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {/* Botão Em Alta — toggle rápido */}
                    <button
                      onClick={() => updateContent(c.id, { isTrending: !c.isTrending })}
                      className={'text-xs px-3 py-1.5 rounded-lg font-semibold ' +
                        (c.isTrending ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25' : 'bg-white/5 text-flixon-muted hover:bg-white/10')}
                      title={c.isTrending ? 'Tirar do Em Alta' : 'Colocar em Em Alta'}
                    >
                      {c.isTrending ? '🔥 Em Alta' : '➕ Em Alta'}
                    </button>
                    <button onClick={() => { onEdit(c.id); setPreviewId(null); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-flixon-violet/15 text-flixon-violet-light hover:bg-flixon-violet/25 font-semibold">Editar</button>
                    {c.embedUrl && (
                      <button onClick={() => setPreviewId(previewId === c.id ? null : c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                        {previewId === c.id ? 'Ocultar' : 'Testar'}
                      </button>
                    )}
                    <button onClick={() => { if (confirm(`Remover "${c.title}"?`)) removeContent(c.id); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">Remover</button>
                  </div>
                </div>
                {previewId === c.id && c.embedUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-flixon-border bg-black mt-3">
                    <iframe src={c.embedUrl} title={c.title} className="w-full h-full" allow="autoplay; fullscreen; encrypted-media" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SeasonsEditor (igual, mas com operações async) ──
function SeasonsEditor({ content, addSeason, updateSeason, removeSeason, addEpisode, updateEpisode, removeEpisode }) {
  const seasons = content.seasons || [];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Temporadas</h3>
        <button onClick={() => addSeason(content.id)} className="px-3 py-1.5 rounded-lg bg-flixon-bg border border-flixon-border hover:bg-flixon-card-hover text-xs font-semibold">+ Temporada</button>
      </div>
      {seasons.length === 0 ? (
        <p className="text-flixon-muted text-sm py-4 text-center">Nenhuma temporada. Clique em "+ Temporada".</p>
      ) : (
        <div className="space-y-3">
          {seasons.map((s) => (
            <div key={s.id} className="bg-flixon-card rounded-xl border border-flixon-border p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-flixon-muted">T</span>
                <input type="number" defaultValue={s.number} onBlur={(e) => updateSeason(content.id, s.id, { number: Number(e.target.value) || s.number })}
                  className="w-14 px-2 py-1.5 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm text-center" />
                <input defaultValue={s.title} onBlur={(e) => updateSeason(content.id, s.id, { title: e.target.value })}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm" placeholder={`Temporada ${s.number}`} />
                <button onClick={() => addEpisode(content.id, s.id)} className="px-3 py-1.5 rounded-lg bg-flixon-bg border border-flixon-border hover:bg-flixon-card-hover text-xs font-semibold">+ Episódio</button>
                <button onClick={() => { if (confirm('Remover temporada?')) removeSeason(content.id, s.id); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Excluir"><TrashIcon /></button>
              </div>
              <div className="space-y-2">
                {(s.episodes || []).map((e) => (
                  <div key={e.id} className="bg-flixon-bg rounded-lg p-2.5 border border-flixon-border">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs text-flixon-muted shrink-0">Episódio</label>
                      <input type="number" defaultValue={e.number} onBlur={(ev) => updateEpisode(content.id, s.id, e.id, { number: Number(ev.target.value) || e.number })}
                        className="w-16 px-2 py-1.5 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm text-center" />
                      <input defaultValue={e.title} onBlur={(ev) => updateEpisode(content.id, s.id, e.id, { title: ev.target.value })}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm" placeholder="Título (opcional)" />
                      <button onClick={() => removeEpisode(content.id, s.id, e.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Remover"><TrashIcon /></button>
                    </div>
                    <input defaultValue={e.embedUrl || e.videoUrl} onBlur={(ev) => updateEpisode(content.id, s.id, e.id, { embedUrl: ev.target.value.trim(), videoUrl: '' })}
                      className="w-full px-2 py-1.5 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none text-xs mb-2" placeholder="Embed Único (URL ou <iframe>)" />
                    <input defaultValue={e.dubLegUrl} onBlur={(ev) => updateEpisode(content.id, s.id, e.id, { dubLegUrl: ev.target.value.trim() })}
                      className="w-full px-2 py-1.5 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none text-xs" placeholder="Link DUB/LEG" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Profiles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { adminSetPlan } = useAppData();

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_users');
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSetPlan = async (userId, planId) => {
    const res = await adminSetPlan(userId, planId);
    if (res.ok) {
      loadUsers(); // recarrega a lista
    } else {
      alert(res.error || 'Erro ao definir plano.');
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-flixon-card border border-flixon-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-flixon-muted text-left">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-flixon-border">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-flixon-muted text-center">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-flixon-muted text-center">
                Rode <code className="text-flixon-violet-light">supabase-planos.sql</code> no SQL Editor.
              </td></tr>
            ) : users.map((u, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium">
                  {sanitizeText(u.email)}
                  {u.is_admin && <span className="ml-2 text-[10px] text-flixon-violet-light">★ Admin</span>}
                </td>
                <td className="px-4 py-3">
                  {u.plan_name ? (
                    <span className="text-flixon-violet-light font-semibold">{u.plan_name}</span>
                  ) : (
                    <span className="text-flixon-muted">Sem plano</span>
                  )}
                </td>
                <td className="px-4 py-3 text-flixon-muted text-xs">
                  {u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan_id || ''}
                    onChange={(e) => e.target.value && handleSetPlan(u.id, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none text-xs"
                  >
                    <option value="">Definir plano...</option>
                    <option value="basic">Teste (7 dias)</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-flixon-muted text-xs mt-3">
        Selecione um plano no dropdown para atribuir a um usuário. O admin não precisa de plano.
      </p>
    </div>
  );
}

function PlansManager() {
  const { plans, updatePlan } = useAppData();
  return (
    <div className="max-w-3xl space-y-3">
      {plans.map((p) => (
        <div key={p.id} className="bg-flixon-card border border-flixon-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-bold flex-1">{p.name}</span>
            <label className="text-sm text-flixon-muted">Preço (R$)</label>
            <input type="number" step="0.01" defaultValue={p.price} onBlur={(e) => updatePlan(p.id, { price: Number(e.target.value) || 0 })}
              className="w-28 px-3 py-1.5 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none" />
          </div>
          <textarea defaultValue={(p.features || []).join('\n')}
            onBlur={(e) => updatePlan(p.id, { features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            rows={4} className="w-full px-3 py-2 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm" placeholder="Um recurso por linha" />
        </div>
      ))}
    </div>
  );
}

// ── auxiliares ──
const inputCls = 'w-full px-3 py-2 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none transition text-sm';
const Field = ({ label, children }) => (<label className="block"><span className="block text-xs text-flixon-muted mb-1">{label}</span>{children}</label>);
const SourceBtn = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={'px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left flex-1 ' +
    (active ? 'bg-flixon-violet/15 border-flixon-violet text-white' : 'bg-flixon-bg border border-flixon-border text-flixon-muted hover:text-white')}>{children}</button>
);
const ErrorBox = ({ children }) => (<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{children}</div>);
const TrashIcon = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>);
const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)} className={'relative w-11 h-6 rounded-full transition-colors shrink-0 ' + (checked ? 'bg-flixon-violet' : 'bg-flixon-border')}>
    <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ' + (checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
  </button>
);
