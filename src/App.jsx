import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Titlebar from './components/Titlebar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import UpdateNotifier from './components/UpdateNotifier';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import { useProfile } from './context/ProfileContext';
import { isNativeMobile } from './lib/platform';

import Login from './pages/Login';
import Profiles from './pages/Profiles';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Details from './pages/Details';
import Player from './pages/Player';
import MyList from './pages/MyList';
import Search from './pages/Search';
import Plans from './pages/Plans';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

// Layout autenticado + com perfil ativo.
// - Desktop (Electron): Titlebar + Sidebar lateral
// - Mobile (Android/APK): sem Titlebar, navegação inferior
// A versão de PC NÃO é alterada (isNativeMobile é false no Electron).
function Shell() {
  const { activeProfile } = useProfile();
  if (!activeProfile) return <Navigate to="/profiles" replace />;

  if (isNativeMobile) {
    // ── Layout Mobile ──
    return (
      <ErrorBoundary>
        <div className="flex flex-col h-screen bg-flixon-bg">
          <main className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
          <MobileNav />
        </div>
      </ErrorBoundary>
    );
  }

  // ── Layout Desktop (idêntico ao de antes) ──
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-flixon-bg">
        <Titlebar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
        <UpdateNotifier />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      {/* Splash envolvido em ErrorBoundary (a TV Box quebrava o React Router) */}
      {!isNativeMobile && (
        <ErrorBoundary>
          <SplashScreen />
        </ErrorBoundary>
      )}
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profiles" element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><Shell /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/player/:id" element={<Player />} />
            <Route path="/player/:id/:episodeId" element={<Player />} />
            <Route path="/mylist" element={<MyList />} />
            <Route path="/search" element={<Search />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
