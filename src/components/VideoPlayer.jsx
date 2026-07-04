import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isHls } from '../lib/embed';
import Hls from 'hls.js';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ src, title, poster, type, id, episodeId }) {
  const vref = useRef(null);
  const wrapRef = useRef(null);
  const hideTimer = useRef(null);
  const hlsRef = useRef(null);
  const nav = useNavigate();

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [live, setLive] = useState(false);
  const [cssFs, setCssFs] = useState(false); // fallback CSS de fullscreen

  // Configura HLS para streams .m3u8 (canais ao vivo)
  // OTIMIZADO P/ TV BOX: configs agressivas para hardware fraco
  useEffect(() => {
    const v = vref.current;
    if (!v || !src) return;

    let cleanup = () => {};
    if (isHls(src)) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferSize: 0,           // sem limite pesado por tamanho
          maxBufferLength: 10,        // buffer de no máx 10s (alivia RAM)
          maxMaxBufferLength: 15,     // nunca passa de 15s
          enableWorker: false,        // CRUCIAL: Web Workers travam TV Box
          lowLatencyMode: false,      // desativa modo low latency (consome + CPU)
          backBufferLength: 5,        // limpa buffer antigo (5s pra trás)
          maxBufferHole: 0.5,         // tolerância menor pra lacunas
          startLevel: -1,             // auto: começa com qualidade baixa
          capLevelToPlayerSize: true, // qualidade = tamanho do player
          abrEwmaDefaultEstimate: 500000,  // estimate de banda conservador
          startFragPrefetch: false,
          manifestLoadingTimeOut: 20000,
          manifestLoadingMaxRetry: 3
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLive(true);
          v.play().catch(() => {});
        });
        cleanup = () => hls.destroy();
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari nativo / WebView com suporte HLS nativo
        v.src = src;
        setLive(true);
      }
    } else {
      v.src = src;
    }

    return cleanup;
  }, [src]);

  const togglePlay = useCallback(() => {
    const v = vref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const onTime = () => setCurrent(vref.current.currentTime);
  const onLoaded = () => setDuration(vref.current.duration || 0);
  const seek = (e) => {
    const v = vref.current;
    if (live) return; // não permite seek em ao vivo
    v.currentTime = Number(e.target.value);
    setCurrent(v.currentTime);
  };
  const changeVol = (e) => {
    const val = Number(e.target.value);
    const v = vref.current;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };
  const toggleMute = () => {
    const v = vref.current;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    // Tenta a Fullscreen API nativa primeiro
    if (!document.fullscreenElement && !cssFs) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitEnterFullscreen;
      if (req) {
        try {
          const r = req.call(el);
          if (r && r.catch) {
            r.catch(() => {
              // Fallback: fullscreen via CSS se a API falhar
              setCssFs(true);
            });
          }
          return;
        } catch (e) {
          setCssFs(true);
          return;
        }
      }
      // Sem API de fullscreen: usa CSS
      setCssFs(true);
    } else {
      // Sai do fullscreen
      if (document.fullscreenElement) {
        try { document.exitFullscreen?.()?.catch?.(() => {}); } catch (e) {}
      }
      setCssFs(false);
    }
  };

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  const wake = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (vref.current && !vref.current.paused) setShowControls(false);
    }, 2800);
  }, []);

  const onPlay = () => {
    setPlaying(true);
  };
  const onPause = () => setPlaying(false);
  const onEnded = () => {
    setPlaying(false);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  const isFsActive = fullscreen || cssFs;

  return (
    <div
      ref={wrapRef}
      onMouseMove={wake}
      className={'relative bg-black flex items-center justify-center overflow-hidden select-none ' +
        (cssFs ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'w-full h-full')}
    >
      <video
        ref={vref}
        poster={poster}
        className="max-w-full max-h-full"
        onClick={togglePlay}
        onTimeUpdate={onTime}
        onLoadedMetadata={onLoaded}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        playsInline
        autoPlay
      />

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black border border-white/20 flex items-center justify-center hover:bg-flixon-violet transition-colors"
          aria-label="Reproduzir"
        >
          <svg viewBox="0 0 24 24" className="w-9 h-9 ml-1" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {/* Barra superior */}
      <div
        className={
          'absolute top-0 inset-x-0 p-4 flex items-center justify-between transition-opacity duration-300 ' +
          (showControls ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      >
        <button
          onClick={() => nav(-1)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-sm font-semibold"
        >
          ← Voltar
        </button>
        <span className="text-sm font-semibold truncate max-w-[60%]">
          {title}
          {live && <span className="ml-2 text-red-500">● AO VIVO</span>}
        </span>
        <span className="w-16" />
      </div>

      {/* Controles inferiores */}
      <div
        className={
          'absolute bottom-0 inset-x-0 px-4 pb-4 pt-10 transition-opacity duration-300 ' +
          (showControls ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-flixon-muted tabular-nums w-12 text-right">
            {live ? 'AO VIVO' : fmt(current)}
          </span>
          <input
            type="range"
            className="flix-range flex-1"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={seek}
            disabled={live}
            style={{
              background: live
                ? 'linear-gradient(to right, #7C3AED 100%, rgba(255,255,255,0.25) 100%)'
                : `linear-gradient(to right, #7C3AED ${pct}%, rgba(255,255,255,0.25) ${pct}%)`
            }}
          />
          <span className="text-xs text-flixon-muted tabular-nums w-12">
            {live ? '' : fmt(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="hover:text-flixon-violet-light" title={playing ? 'Pausar' : 'Reproduzir'}>
              {playing ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="hover:text-flixon-violet-light" title="Mudo">
                {muted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M11 5L6 9H3v6h3l5 4V5z" />
                    <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M11 5L6 9H3v6h3l5 4V5z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                className="flix-range w-20"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={changeVol}
              />
            </div>
          </div>

          <button onClick={toggleFullscreen} className="hover:text-flixon-violet-light" title="Tela cheia">
            {isFsActive ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 3v3a3 3 0 0 1-3 3H3M21 9h-3a3 3 0 0 1-3-3V3M3 15h3a3 3 0 0 1 3 3v3M15 21v-3a3 3 0 0 1 3-3h3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
