import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ChatPage from '@/pages/ChatPage';
import { SplashScreen } from '@/components/SplashScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const loadUser = useAuthStore(s => s.loadUser);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) loadUser();
  }, []);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
