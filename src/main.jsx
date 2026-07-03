import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { AppDataProvider } from './context/AppDataContext';
import './index.css';

// NOTA: o adblock do mobile agora é 100% nativo (Java):
//  - shouldInterceptRequest: pass-through (não quebra o player)
//  - shouldOverrideUrlLoading: bloqueia tigrinho/cassino
//  - setSupportMultipleWindows(false): bloqueia popups
// A injeção de JS foi REMOVIDA (podia quebrar o Capacitor).

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
