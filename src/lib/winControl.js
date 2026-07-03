// Ponte segura com o processo principal do Electron (window controls).
// Em ambiente web (fora do Electron) os métodos viram no-op.

const api =
  typeof window !== 'undefined' && window.flixon ? window.flixon : null;

export const isElectron = !!api;

// Versão do app vinda do Electron (ou lida do config em ambiente web)
export async function getAppVersion() {
  if (api?.version) {
    const v = await api.version();
    if (v) return v;
  }
  // fallback (web): versão fixa
  return '1.0.0';
}

// Abre um link no navegador externo do sistema (Electron) ou nova aba (web)
export async function openExternal(url) {
  if (api?.openExternal) {
    return api.openExternal(url);
  }
  window.open(url, '_blank');
  return true;
}

export const winControl = {
  minimize: () => api?.window?.minimize?.(),
  toggleMaximize: () => api?.window?.toggleMaximize?.(),
  close: () => api?.window?.close?.(),
  isMaximized: async () => (await api?.window?.isMaximized?.()) ?? false,
  onMaximizeChange: (cb) => api?.window?.onMaximizeChange?.(cb),
  platform: api?.platform || 'web',
  openExternal,
  // Aviso de nova versão (apenas no Electron)
  onUpdateAvailable: (cb) => api?.onUpdateAvailable?.(cb)
};
