import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { GalleryPage, HomePage } from './pages';
import { initializeConfigFromURL } from './utils/configManager';

type PhotoStripType = {
  id: number;
  photos: string[];
  timestamp: string;
  date: string;
};

type AppState = {
  photoStrips: PhotoStripType[];
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    photoStrips: JSON.parse(localStorage.getItem('photoStrips') || '[]'),
  });

  useEffect(() => {
    setTimeout(() => setIsInitialLoad(false), 100);
  }, []);

  useEffect(() => {
    initializeConfigFromURL();
  }, []);

  // Dynamic viewport height for mobile browsers
  useEffect(() => {
    const update = () => {
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('photoStrips', JSON.stringify(appState.photoStrips));
  }, [appState.photoStrips]);

  const navigateTo = (page: string) => {
    if (page === currentPage) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false);
    }, 300);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'gallery':
        return <GalleryPage navigateTo={navigateTo} appState={appState} setAppState={setAppState} />;
      default:
        return <HomePage navigateTo={navigateTo} appState={appState} setAppState={setAppState} />;
    }
  };

  return (
    <div className={`h-full w-full overflow-hidden ${isInitialLoad ? 'opacity-0' : 'fade-in'}`}>
      <div className={`${isTransitioning ? 'fade-out' : 'fade-in'} h-full w-full`}>
        {renderPage()}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
