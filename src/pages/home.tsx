import { FaImage, FaCameraRotate, FaChevronLeft, FaChevronRight, FaCircleInfo } from "react-icons/fa6";
import { LuCoins } from "react-icons/lu";
import { Footer } from "../components/Footer";
import { ThemeToggle } from "../components/ThemeToggle";
import { Houses } from "../components/Houses";
import { Clouds } from "../components/Clouds";
import { Stars } from "../components/Stars";
import { InstagramModal } from "../components/InstagramModal";
import { InfoGuideModal } from "../components/InfoGuideModal";
import { PixelButton, PixelButtonVertical, PixelIconButton } from "../components/PixelButton";
import { useState, useEffect } from "react";
import { FilterType, getFilterName, getCSSFilter } from "../utils/filters";
import { isInstagramBrowser } from "../utils/photostrip";
import { getPhotosRemaining, isKeyBasedConfig } from "../utils/configManager";

// Home Page Component
type HomePageProps = {
  navigateTo: (route: string) => void;
  appState?: any;
  setAppState?: React.Dispatch<React.SetStateAction<any>>;
};

export const HomePage = ({
  navigateTo,
  appState,
  setAppState,
}: HomePageProps) => {
  const photoStripCount = appState?.photoStrips?.length || 0;
  const photoCount = appState?.photoCount || 4;
  const [isMobile, setIsMobile] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const cameraFacing = appState?.cameraFacing || "user";
  const selectedFilter = (appState?.selectedFilter as FilterType) || "normal";

  // Photo limit tracking
  const photosRemaining = getPhotosRemaining();
  const isKeyBased = isKeyBasedConfig();

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // Detect Instagram browser and show modal
  useEffect(() => {
    if (isInstagramBrowser()) {
      setShowInstagramModal(true);
    }
  }, []);

  // Auto-show info modal on first visit (after Instagram modal if present)
  useEffect(() => {
    const hasSeenInfoGuide = localStorage.getItem('hasSeenInfoGuide');

    if (!hasSeenInfoGuide) {
      // If Instagram modal is showing, delay the info modal
      if (isInstagramBrowser()) {
        // Wait a bit for user to close Instagram modal first
        const timer = setTimeout(() => {
          if (!showInstagramModal) {
            setShowInfoModal(true);
          }
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // Show immediately if not Instagram browser
        setShowInfoModal(true);
      }
    }
  }, [showInstagramModal]);

  // Mark info guide as seen when modal closes
  const handleInfoModalClose = () => {
    setShowInfoModal(false);
    localStorage.setItem('hasSeenInfoGuide', 'true');
  };

  const toggleCamera = () => {
    setAppState?.((prev: any) => ({
      ...prev,
      cameraFacing: prev.cameraFacing === "user" ? "environment" : "user",
    }));
  };

  const filters: FilterType[] = ['normal', 'blackAndWhite', 'cute', 'film'];
  const currentFilterIndex = filters.indexOf(selectedFilter);

  const nextFilter = () => {
    const nextIndex = (currentFilterIndex + 1) % filters.length;
    setAppState?.((prev: any) => ({
      ...prev,
      selectedFilter: filters[nextIndex],
    }));
  };

  const prevFilter = () => {
    const prevIndex = (currentFilterIndex - 1 + filters.length) % filters.length;
    setAppState?.((prev: any) => ({
      ...prev,
      selectedFilter: filters[prevIndex],
    }));
  };

  return (
    <div className="h-full w-full relative overflow-hidden touch-none" style={{ height: '100dvh' }}>
      {/* Sky Background */}
      {/* <div className="absolute inset-0 bg-red-200 dark:bg-gray-800"></div> */}

      {/* Theme Toggle */}
      {setAppState && <ThemeToggle appState={appState} setAppState={setAppState} />}

      {/* Info Button - Top Left */}
      <button
        onClick={() => setShowInfoModal(true)}
        className="absolute top-3 left-3 sm:top-6 sm:left-6 z-50 p-1.5 sm:p-2 doodle-button transition-all bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 shadow-lg"
        aria-label="Photo booth guide"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))',
          left: 'max(0.75rem, env(safe-area-inset-left, 0.75rem))'
        }}
      >
        <FaCircleInfo className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Settings Button */}
      {/* {setAppState && <Settings appState={appState} setAppState={setAppState} />} */}

      {/* Main Scene Container */}
      <div className="absolute inset-0 flex flex-col pt-12 sm:pt-16" style={{
        paddingTop: 'max(3rem, env(safe-area-inset-top, 3rem))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Stars (only in dark mode) */}
        <Stars />

        {/* Clouds */}
        <Clouds />

        {/* Sky Area */}
        <div className="flex-1 flex items-end justify-center pb-0 relative overflow-visible min-h-0" style={{ minHeight: 0 }}>
          {/* Houses positioned above ground (farthest back) */}
          <div className="absolute bottom-0 left-0 right-0 z-0">
            <Houses />
          </div>

          {/* Photo Booth Structure */}
          <div className="mb-0 z-30 relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm px-2 sm:px-3 flex flex-col justify-end">
            {/* Top Sign */}
            <div className="doodle-border-thick p-1.5 sm:p-2 md:p-3 shadow-2xl sketch-shadow bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
              <h1 className="text-base sm:text-lg md:text-3xl lg:text-4xl font-black text-center leading-tight text-black dark:text-white font-chango">
                Pocket Booth
              </h1>
              <p className="text-center text-[10px] sm:text-xs md:text-base font-bold mt-0.5 sm:mt-1 text-gray-600 dark:text-gray-400 font-micro">
                Photo Strip
              </p>
            </div>

            {/* Main Booth Body */}
            <div className="doodle-border-thick p-1.5 sm:p-2 md:p-3 shadow-2xl gap-1.5 sm:gap-2 md:gap-3 flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
              {/* TV Screen Area - Filter Selection */}
              <div className="bg-gray-900 doodle-box text-white p-1 sm:p-1.5 shadow-inner">
                <div className="aspect-[16/12] bg-black doodle-border flex flex-col relative tv-screen">
                  {/* Top: Filter Demo Box - Takes available space above buttons */}
                  <div className="flex-1 flex items-center justify-center tv-flicker z-20 min-h-0">
                    <img
                      src="https://img.freepik.com/premium-vector/pixel-art-characters-set-8bit-avatar-funny-faces-80s-nft-cartoon-vector-icon_250257-5371.jpg"
                      alt="Character waving"
                      className="w-full h-full object-cover object-top"
                      style={{ filter: getCSSFilter(selectedFilter) }}
                    />
                  </div>

                  {/* Bottom: Arrow buttons and Filter Name */}
                  <div className="flex items-stretch h-10 sm:h-12 md:h-16 z-30 flex-shrink-0 relative">
                    {/* Left Arrow - Full Height */}
                    <PixelIconButton
                      onClick={prevFilter}
                      variant="primary"
                      size="lg"
                      className="flex-shrink-0 h-full rounded-none"
                    >
                      <FaChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7" />
                    </PixelIconButton>

                    {/* Center: Filter Name - Bouncing Characters */}
                    <div className="flex-grow flex items-center justify-center bg-slate-800">
                      <div className="text-yellow-400 font-bold text-[10px] sm:text-xs md:text-base text-center font-mono tracking-wider">
                        {getFilterName(selectedFilter).split('').map((char, index) => (
                          <span key={index} className="bounce-char">
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Arrow - Full Height */}
                    <PixelIconButton
                      onClick={nextFilter}
                      variant="primary"
                      size="lg"
                      className="flex-shrink-0 h-full rounded-none"
                    >
                      <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7" />
                    </PixelIconButton>
                  </div>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="doodle-box p-1 sm:p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
                <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                  {/* Insert Coin Button - Left */}
                  <PixelButtonVertical
                    onClick={() => navigateTo("photobooth")}
                    variant="primary"
                    icon={<LuCoins className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 mb-0.5 sm:mb-1 animate-pulse" />}
                  >
                    <>
                      <span>INSERT</span> &nbsp;
                      <span>COIN</span>
                    </>
                  </PixelButtonVertical>

                  {/* Gallery Button - Right */}
                  <PixelButtonVertical
                    onClick={() => navigateTo("gallery")}
                    variant="secondary"
                    icon={<FaImage className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 mb-0.5 sm:mb-1" />}
                  >
                    <>
                      <span>GALLERY</span> &nbsp;
                      <span className="font-tiny5">({photoStripCount})</span>
                    </>
                  </PixelButtonVertical>
                </div>
              </div>

              {/* Photos Remaining Display - Only show when key is used and limit exists */}
              {isKeyBased && photosRemaining !== undefined && (
                <div className={`doodle-border text-center p-1.5 ${
                  photosRemaining === 0
                    ? 'bg-red-200 dark:bg-red-900/30 border-red-600 dark:border-red-400'
                    : photosRemaining <= 2
                    ? 'bg-yellow-200 dark:bg-yellow-900/30 border-yellow-600 dark:border-yellow-400'
                    : 'bg-green-200 dark:bg-green-900/30 border-green-600 dark:border-green-400'
                }`}>
                  <p className={`text-[10px] sm:text-xs md:text-sm font-bold leading-tight mb-0.5 font-micro ${
                    photosRemaining === 0
                      ? 'text-red-800 dark:text-red-200'
                      : photosRemaining <= 2
                      ? 'text-yellow-800 dark:text-yellow-200'
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {photosRemaining === 0 ? 'No Uploads Left' : 'Upload Remaining'}
                  </p>
                  {photosRemaining > 0 && (
                    <p className={`text-base sm:text-lg md:text-xl font-black font-tiny5 ${
                      photosRemaining <= 2
                        ? 'text-yellow-900 dark:text-yellow-100'
                        : 'text-green-900 dark:text-green-100'
                    }`}>
                      {photosRemaining}
                    </p>
                  )}
                </div>
              )}

              {/* Photo Count Selector */}
              <div className="bg-slate-800 doodle-border text-black p-1 sm:p-1.5">
                <p className="text-white text-center text-[10px] sm:text-xs md:text-sm font-bold leading-tight mb-0.5 sm:mb-1 font-micro">
                  Strip Length
                </p>
                <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4].map((count) => (
                    <PixelButton
                      key={count}
                      onClick={() =>
                        setAppState?.((prev: any) => ({
                          ...prev,
                          photoCount: count,
                        }))
                      }
                      variant={photoCount === count ? "primary" : "secondary"}
                      size="sm"
                      className={`font-tiny5 text-xs sm:text-sm md:text-lg transition-all ${
                        photoCount === count ? "scale-105" : ""
                      }`}
                    >
                      {count}
                    </PixelButton>
                  ))}
                </div>
              </div>

              {/* Camera Selection (Mobile Only) */}
              {isMobile && (
                <div className="bg-blue-100 doodle-border text-black p-1 sm:p-1.5">
                  <p className="text-black text-center text-[10px] sm:text-xs md:text-sm font-bold leading-tight mb-0.5 sm:mb-1 font-micro">
                    Camera
                  </p>
                  <PixelButton
                    onClick={toggleCamera}
                    variant="secondary"
                    size="md"
                    fullWidth
                    icon={<FaCameraRotate className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                  >
                    {cameraFacing === "user" ? "FRONT" : "BACK"}
                  </PixelButton>
                </div>
              )}
            </div>

            {/* Bottom Base */}
            <div className="bg-gray-200 dark:bg-gray-900 doodle-border-thick text-gray-800 dark:text-gray-300 p-1 sm:p-2 shadow-2xl border-gray-800 dark:border-gray-300">
              <div className="h-2 sm:h-3 md:h-4 bg-gray-300 dark:bg-gray-600 doodle-border border-gray-800 dark:border-gray-300"></div>
            </div>
          </div>
        </div>

        {/* Ground Area - base only */}
        <div className="h-10 sm:h-13 md:h-12 lg:h-14 bg-gray-500/70 dark:bg-slate-950 border-y-0 relative flex-shrink-0"></div>
      </div>

      <Footer />

      {/* Instagram Browser Modal */}
      {showInstagramModal && (
        <InstagramModal onClose={() => setShowInstagramModal(false)} />
      )}

      {/* Info Guide Modal */}
      {showInfoModal && <InfoGuideModal onClose={handleInfoModalClose} />}
    </div>
  );
};
