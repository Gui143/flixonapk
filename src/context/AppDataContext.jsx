import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DEFAULT_PLANS = [
  { id: 'basic', name: 'Teste', price: 0, period: '/7 dias', quality: 'HD 720p', devices: 1, features: ['Catálogo completo', 'Qualidade HD 720p', '1 tela simultânea', 'Teste de 7 dias', 'Apenas 1 vez por conta'] },
  { id: 'standard', name: 'Standard', price: 9.99, period: '/mês', quality: 'Full HD 1080p', devices: 2, features: ['Catálogo completo', 'Qualidade Full HD', '2 telas simultâneas', 'Download offline'] },
  { id: 'premium', name: 'Premium', price: 19.99, period: '/mês', quality: '4K + HDR', devices: 4, highlight: true, features: ['Catálogo completo', '4K Ultra HD + HDR', '4 telas simultâneas', 'Áudio espacial', 'Downloads ilimitados'] }
];

export const CATEGORIES = [
  { id: 'movie', label: 'Filme', plural: 'Filmes' },
  { id: 'tv', label: 'Série', plural: 'Séries' },
  { id: 'anime', label: 'Anime', plural: 'Animes' },
  { id: 'channel', label: 'Canal', plural: 'Canais' }
];
export const categoryLabel = (t) => CATEGORIES.find((c) => c.id === t)?.label || 'Título';
export const categoryPlural = (t) => CATEGORIES.find((c) => c.id === t)?.plural || 'Títulos';

// Normaliza dados do Supabase (snake_case) para o formato do app (camelCase)
function normContent(c) {
  return {
    id: c.id,
    title: c.title || '',
    type: c.type || 'movie',
    poster: c.poster || '',
    backdrop: c.backdrop || '',
    year: c.year || '',
    rating: c.rating || '',
    genres: c.genres || [],
    overview: c.overview || '',
    embedUrl: c.embed_url || '',
    videoUrl: c.video_url || '',
    featured: c.featured || false,
    upcoming: c.upcoming || false,
    isTrending: c.is_trending !== false,
    seriesMode: c.series_mode || 'simple',
    ageRating: c.age_rating || '',
    createdAt: c.created_at,
    seasons: (c.seasons || [])
      .map(normSeason)
      .sort((a, b) => (a.number || 0) - (b.number || 0))
  };
}
function normSeason(s) {
  return {
    id: s.id,
    number: s.number || 1,
    title: s.title || '',
    episodes: (s.episodes || [])
      .map(normEpisode)
      .sort((a, b) => (a.number || 0) - (b.number || 0))
  };
}
function normEpisode(e) {
  return {
    id: e.id,
    number: e.number || 1,
    title: e.title || '',
    duration: e.duration || '',
    embedUrl: e.embed_url || '',
    videoUrl: e.video_url || '',
    dubLegUrl: e.dub_leg_url || ''
  };
}

const AppDataContext = createContext(null);
export const useAppData = () => useContext(AppDataContext);

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [mylist, setMylist] = useState([]);
  const [ratings, setRatings] = useState({});
  const [userPlan, setUserPlan] = useState(null);
  const [planInfo, setPlanInfo] = useState({ active: false, name: null, daysLeft: 0 });

  // ── Carrega conteúdo (com seasons + episodes aninhados) ──
  const loadContent = useCallback(async () => {
    const { data, error } = await supabase
      .from('content')
      .select('*, seasons(*, episodes(*))')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setLibrary(data.map(normContent));
    }
    setLoading(false);
  }, []);

  // ── Carrega planos ──
  const loadPlans = useCallback(async () => {
    const { data } = await supabase.from('plans').select('*');
    if (data && data.length > 0) {
      setPlans(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          period: p.period || '/mês',
          quality: p.quality || '',
          devices: p.devices || 1,
          features: p.features || [],
          highlight: p.highlight || false
        }))
      );
    }
  }, []);

  useEffect(() => {
    loadContent();
    loadPlans();
  }, [loadContent, loadPlans]);

  // ── Carrega mylist, ratings e plano quando o usuário muda ──
  useEffect(() => {
    if (!user) {
      setMylist([]);
      setRatings({});
      setUserPlan(null);
      setPlanInfo({ active: false, name: null, daysLeft: 0 });
      return;
    }
    (async () => {
      const [{ data: listData }, { data: rateData }, { data: planData }] = await Promise.all([
        supabase.from('mylist').select('content_id').eq('user_id', user.id),
        supabase.from('ratings').select('content_id, vote').eq('user_id', user.id),
        supabase.rpc('has_active_plan')
      ]);
      setMylist((listData || []).map((r) => r.content_id));
      const rateMap = {};
      (rateData || []).forEach((r) => { rateMap[r.content_id] = r.vote; });
      setRatings(rateMap);
      // planData vem do RPC has_active_plan
      if (planData && planData.length > 0) {
        const p = planData[0];
        setUserPlan(p.plan_id);
        setPlanInfo({
          active: p.has_plan,
          name: p.plan_name,
          daysLeft: p.days_left || 0
        });
      } else {
        setUserPlan(null);
        setPlanInfo({ active: false, name: null, daysLeft: 0 });
      }
    })();
  }, [user]);

  // ── CRUD de conteúdo ──
  const addContent = useCallback(async (entry) => {
    const { data, error } = await supabase
      .from('content')
      .insert({
        title: entry.title,
        type: entry.type,
        poster: entry.poster || '',
        backdrop: entry.backdrop || '',
        year: entry.year || '',
        rating: entry.rating || '',
        genres: entry.genres || [],
        overview: entry.overview || '',
        embed_url: entry.embedUrl || '',
        video_url: entry.videoUrl || '',
        featured: entry.featured || false,
        upcoming: entry.upcoming || false,
        is_trending: entry.isTrending !== false,
        series_mode: entry.seriesMode || 'simple',
        age_rating: entry.ageRating || ''
      })
      .select('*, seasons(*, episodes(*))')
      .single();
    if (!error && data) {
      setLibrary((prev) => [normContent(data), ...prev]);
      return normContent(data);
    }
    return null;
  }, []);

  const updateContent = useCallback(async (id, patch) => {
    // converte camelCase para snake_case
    const dbPatch = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    if (patch.poster !== undefined) dbPatch.poster = patch.poster;
    if (patch.backdrop !== undefined) dbPatch.backdrop = patch.backdrop;
    if (patch.year !== undefined) dbPatch.year = patch.year;
    if (patch.rating !== undefined) dbPatch.rating = patch.rating;
    if (patch.genres !== undefined) dbPatch.genres = patch.genres;
    if (patch.overview !== undefined) dbPatch.overview = patch.overview;
    if (patch.embedUrl !== undefined) dbPatch.embed_url = patch.embedUrl;
    if (patch.videoUrl !== undefined) dbPatch.video_url = patch.videoUrl;
    if (patch.featured !== undefined) dbPatch.featured = patch.featured;
    if (patch.upcoming !== undefined) dbPatch.upcoming = patch.upcoming;
    if (patch.isTrending !== undefined) dbPatch.is_trending = patch.isTrending;
    if (patch.seriesMode !== undefined) dbPatch.series_mode = patch.seriesMode;
    if (patch.ageRating !== undefined) dbPatch.age_rating = patch.ageRating;

    const { error } = await supabase.from('content').update(dbPatch).eq('id', id);
    if (!error) {
      setLibrary((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    }
  }, []);

  const removeContent = useCallback(async (id) => {
    const { error } = await supabase.from('content').delete().eq('id', id);
    if (!error) {
      setLibrary((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  // ── Temporadas ──
  const addSeason = useCallback(async (contentId) => {
    const existing = library.find((c) => c.id === contentId);
    const num = (existing?.seasons?.length || 0) + 1;
    const { data, error } = await supabase
      .from('seasons')
      .insert({ content_id: contentId, number: num, title: `Temporada ${num}` })
      .select()
      .single();
    if (!error && data) {
      setLibrary((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          return { ...c, seasons: [...c.seasons, normSeason(data)] };
        })
      );
    }
  }, [library]);

  const updateSeason = useCallback(async (contentId, seasonId, patch) => {
    const dbPatch = {};
    if (patch.number !== undefined) dbPatch.number = patch.number;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    const { error } = await supabase.from('seasons').update(dbPatch).eq('id', seasonId);
    if (!error) {
      setLibrary((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          return {
            ...c,
            seasons: c.seasons.map((s) => (s.id === seasonId ? { ...s, ...patch } : s))
          };
        })
      );
    }
  }, []);

  const removeSeason = useCallback(async (contentId, seasonId) => {
    const { error } = await supabase.from('seasons').delete().eq('id', seasonId);
    if (!error) {
      setLibrary((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          return { ...c, seasons: c.seasons.filter((s) => s.id !== seasonId) };
        })
      );
    }
  }, []);

  // ── Episódios ──
  const addEpisode = useCallback(async (contentId, seasonId) => {
    const content = library.find((c) => c.id === contentId);
    const season = content?.seasons?.find((s) => s.id === seasonId);
    const num = (season?.episodes?.length || 0) + 1;
    const { data, error } = await supabase
      .from('episodes')
      .insert({ season_id: seasonId, number: num })
      .select()
      .single();
    if (!error && data) {
      setLibrary((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          return {
            ...c,
            seasons: c.seasons.map((s) =>
              s.id === seasonId
                ? { ...s, episodes: [...s.episodes, normEpisode(data)] }
                : s
            )
          };
        })
      );
    }
  }, [library]);

  const updateEpisode = useCallback(async (contentId, seasonId, episodeId, patch) => {
    const dbPatch = {};
    if (patch.number !== undefined) dbPatch.number = patch.number;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.duration !== undefined) dbPatch.duration = patch.duration;
    if (patch.embedUrl !== undefined) dbPatch.embed_url = patch.embedUrl;
    if (patch.videoUrl !== undefined) dbPatch.video_url = patch.videoUrl;
    if (patch.dubLegUrl !== undefined) dbPatch.dub_leg_url = patch.dubLegUrl;
    const { error } = await supabase.from('episodes').update(dbPatch).eq('id', episodeId);
    if (!error) {
      setLibrary((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          return {
            ...c,
            seasons: c.seasons.map((s) => {
              if (s.id !== seasonId) return s;
              return {
                ...s,
                episodes: s.episodes.map((e) => (e.id === episodeId ? { ...e, ...patch } : e))
              };
            })
          };
        })
      );
    }
  }, []);

  const removeEpisode = useCallback(async (contentId, seasonId, episodeId) => {
    const { error } = await supabase.from('episodes').delete().eq('id', episodeId);
    if (!error) {
      setLibrary((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          return {
            ...c,
            seasons: c.seasons.map((s) => {
              if (s.id !== seasonId) return s;
              return { ...s, episodes: s.episodes.filter((e) => e.id !== episodeId) };
            })
          };
        })
      );
    }
  }, []);

  // ── Helpers (iguais à versão anterior) ──
  const getContent = useCallback(() => library, [library]);
  const getContentById = useCallback((id) => library.find((c) => c.id === id) || null, [library]);
  const episodeCount = useCallback((contentId) => {
    const c = library.find((x) => x.id === contentId);
    if (!c?.seasons) return 0;
    return c.seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
  }, [library]);

  const catalogContent = useMemo(
    () => library.filter((c) => !c.upcoming),
    [library]
  );
  const getByCategory = useCallback(
    (type) => catalogContent.filter((c) => c.type === type),
    [catalogContent]
  );
  const getUpcoming = useCallback(() => library.filter((c) => c.upcoming), [library]);
  const getFeatured = useCallback(() => library.filter((c) => c.featured), [library]);
  const getTrending = useCallback(() => library.filter((c) => c.isTrending && !c.upcoming), [library]);
  const searchContent = useCallback(
    (q) => {
      if (!q) return [];
      const ql = q.toLowerCase();
      return library.filter(
        (i) =>
          i.title?.toLowerCase().includes(ql) ||
          (i.genres || []).some((g) => g.toLowerCase().includes(ql))
      );
    },
    [library]
  );

  // ── Minha Lista (servidor) ──
  const toggleList = useCallback(async (item) => {
    if (!user) return;
    const isIn = mylist.includes(item.id);
    if (isIn) {
      await supabase.from('mylist').delete().eq('user_id', user.id).eq('content_id', item.id);
      setMylist((prev) => prev.filter((id) => id !== item.id));
    } else {
      await supabase.from('mylist').insert({ user_id: user.id, content_id: item.id });
      setMylist((prev) => [...prev, item.id]);
    }
  }, [user, mylist]);

  const removeFromList = useCallback(async (id) => {
    if (!user) return;
    await supabase.from('mylist').delete().eq('user_id', user.id).eq('content_id', id);
    setMylist((prev) => prev.filter((x) => x !== id));
  }, [user]);

  const isInList = useCallback((id) => mylist.includes(id), [mylist]);

  // ── Ratings (like/dislike no servidor) ──
  const castVote = useCallback(async (contentId, vote) => {
    if (!user) return;
    const current = ratings[contentId];
    if (current === vote) {
      // remove o voto
      await supabase.from('ratings').delete().eq('user_id', user.id).eq('content_id', contentId);
      setRatings((prev) => {
        const next = { ...prev };
        delete next[contentId];
        return next;
      });
    } else {
      // upsert
      await supabase
        .from('ratings')
        .upsert({ user_id: user.id, content_id: contentId, vote }, { onConflict: 'user_id,content_id' });
      setRatings((prev) => ({ ...prev, [contentId]: vote }));
    }
  }, [user, ratings]);

  const getVote = useCallback((contentId) => ratings[contentId] || null, [ratings]);

  // ── Planos ──
  const updatePlan = useCallback(async (id, patch) => {
    const dbPatch = {};
    if (patch.price !== undefined) dbPatch.price = patch.price;
    if (patch.features !== undefined) dbPatch.features = patch.features;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    await supabase.from('plans').update(dbPatch).eq('id', id);
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  // Usuário assina plano (via RPC — trial só 1x)
  const subscribePlan = useCallback(async (planId) => {
    if (!user) return { ok: false, error: 'Faça login.' };
    const { data, error } = await supabase.rpc('subscribe_plan', { plan: planId });
    if (error || data === false) {
      return { ok: false, error: 'Não foi possível assinar (trial já usado ou erro).' };
    }
    const { data: planData } = await supabase.rpc('has_active_plan');
    if (planData && planData.length > 0) {
      const p = planData[0];
      setUserPlan(p.plan_id);
      setPlanInfo({ active: p.has_plan, name: p.plan_name, daysLeft: p.days_left || 0 });
    }
    return { ok: true };
  }, [user]);

  // Admin define plano de qualquer usuário
  const adminSetPlan = useCallback(async (targetUserId, planId) => {
    const { data, error } = await supabase.rpc('admin_set_user_plan', {
      target_user: targetUserId, plan: planId
    });
    return { ok: !error && data === true, error: error?.message };
  }, []);

  const value = {
    library,
    loading,
    getContent,
    getContentById,
    catalogContent,
    getByCategory,
    getUpcoming,
    getFeatured,
    getTrending,
    searchContent,
    addContent,
    updateContent,
    removeContent,
    addSeason,
    updateSeason,
    removeSeason,
    addEpisode,
    updateEpisode,
    removeEpisode,
    episodeCount,
    mylist,
    toggleList,
    removeFromList,
    isInList,
    castVote,
    getVote,
    plans,
    updatePlan,
    userPlan,
    subscribePlan,
    adminSetPlan,
    planInfo,
    reload: loadContent
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
