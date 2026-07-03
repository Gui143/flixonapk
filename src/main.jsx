import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { AppDataProvider } from './context/AppDataContext';
import { initMobileAdblock } from './lib/mobileAdblock';
import './index.css';

// Inicializa o adblock mobile (no-op no Electron, ativo no Android)
initMobileAdblock();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ProfileProvider>
          <AppDataProvider>
            <App />
          </AppDataProvider>
        </ProfileProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
