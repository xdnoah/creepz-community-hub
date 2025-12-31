import { useIsMobile } from './hooks/useIsMobile';
import { useAuth } from './contexts/AuthContext';
import { Desktop } from './components/Desktop/Desktop';
import { MobileAuth } from './components/Mobile/MobileAuth';
import { MobileChat } from './components/Mobile/MobileChat';
import { LoadingScreen } from './components/ui/LoadingScreen';

function App() {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Mobile: switch between auth and chat
  if (isMobile) {
    return user ? <MobileChat /> : <MobileAuth />;
  }

  // Desktop: always show Desktop, with auth window if not logged in
  return <Desktop showAuthWindow={!user} />;
}

export default App;
