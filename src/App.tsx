import { StrictMode, useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { GalleryPage, HomePage, PhotoBoothPage } from './pages';
import { initializeConfigFromURL } from './utils/configManager';

// Main App Component with Routing
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [appState, setAppState] = useState({
    myStream: null,
    photoStrips: JSON.parse(localStorage.getItem('photoStrips') || '[]'),
    photoCount: parseInt(localStorage.getItem('photoCount') || '4'),
    cameraFacing: localStorage.getItem('cameraFacing') || 'user',
    debugCamera: localStorage.getItem('debugCamera') === 'true',
    theme: localStorage.getItem('theme') || 'light'
  });

  const refs = {
    videoRef: useRef<HTMLVideoElement>(null),
    canvasRef: useRef<HTMLCanvasElement>(null)
  };

  // Handle initial load fade-in
  useEffect(() => {
    setTimeout(() => setIsInitialLoad(false), 100);
  }, []);

  // Initialize configuration from URL on app load
  useEffect(() => {
    // Parse URL parameters and set up key-based config if present
    initializeConfigFromURL();
  }, []);

  // Apply theme to document and save to local storage
  useEffect(() => {
    if (appState.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', appState.theme);
  }, [appState.theme]);

  // Save photoCount to localStorage
  useEffect(() => {
    localStorage.setItem('photoCount', appState.photoCount.toString());
  }, [appState.photoCount]);

  // Save cameraFacing to localStorage
  useEffect(() => {
    localStorage.setItem('cameraFacing', appState.cameraFacing);
  }, [appState.cameraFacing]);

  // Save debugCamera to localStorage
  useEffect(() => {
    localStorage.setItem('debugCamera', appState.debugCamera.toString());
  }, [appState.debugCamera]);

  // Save photoStrips to localStorage
  useEffect(() => {
    localStorage.setItem('photoStrips', JSON.stringify(appState.photoStrips));
  }, [appState.photoStrips]);

  // Dynamic viewport height handling for mobile browsers
  useEffect(() => {
    const updateViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight;
      // Set CSS variable
      document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
    };

    // Update on mount
    updateViewportHeight();

    // Update on resize (for when mobile browser chrome appears/disappears)
    window.addEventListener('resize', updateViewportHeight);
    // Update on orientation change
    window.addEventListener('orientationchange', updateViewportHeight);
    // Update on scroll (for mobile browser address bar hiding)
    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateViewportHeight, 100);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
      case 'home':
        return <HomePage navigateTo={navigateTo} appState={appState} setAppState={setAppState} />;
      case 'photobooth':
        return <PhotoBoothPage navigateTo={navigateTo} appState={appState} setAppState={setAppState} refs={refs} />;
      case 'gallery':
        return <GalleryPage navigateTo={navigateTo} appState={appState} setAppState={setAppState} />;
      default:
        return <HomePage navigateTo={navigateTo} appState={appState} setAppState={setAppState} />;
    }
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${isInitialLoad ? 'opacity-0' : 'fade-in'}`}>
      <div className={isTransitioning ? 'fade-out ' : 'fade-in ' + ' h-full w-full'}>
        {renderPage()}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={refs.canvasRef} className="hidden" />
    </div>
  );
};

// Render the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);