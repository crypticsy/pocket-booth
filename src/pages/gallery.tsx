import { FaCamera, FaDownload, FaImage, FaArrowLeft, FaTrash } from 'react-icons/fa6';
import { useState } from 'react';
import { Footer } from '../components/Footer';
import { InstagramModal } from '../components/InstagramModal';
import { downloadPhotoStrip } from '../utils/photostrip';

type PhotoStripType = {
  id: number;
  photos: string[];
  timestamp: string;
  date: string;
};

type GalleryPageProps = {
  navigateTo: (route: string) => void;
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
};

// Gallery Page Component
export const GalleryPage = ({ navigateTo, appState, setAppState }: GalleryPageProps) => {
  const [showInstagramModal, setShowInstagramModal] = useState(false);

  const handleDownload = async (strip: PhotoStripType) => {
    const success = await downloadPhotoStrip(strip.photos, `photo-strip-${strip.id}.jpg`);
    if (!success) {
      // Show Instagram modal if download wasn't possible
      setShowInstagramModal(true);
    }
  };

  const deleteStrip = (stripId: number) => {
    setAppState((prev: typeof appState) => ({
      ...prev,
      photoStrips: prev.photoStrips.filter((strip: PhotoStripType) => strip.id !== stripId)
    }));
  };

  const photoStrips = appState.photoStrips || [];

  return (
    <div
      className="w-full overflow-y-auto text-black dark:text-white fixed inset-0"
      style={{
        height: 'var(--viewport-height, 100vh)',
        minHeight: '-webkit-fill-available',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-8 md:pb-12 gap-2">
          <button
            onClick={() => navigateTo('home')}
            className="transition-colors flex items-center gap-1 sm:gap-2 doodle-button px-2 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300 flex-shrink-0"
          >
            <FaArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-lg font-bold hidden sm:inline">Back</span>
          </button>

          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold wavy-underline text-black dark:text-white text-center flex-shrink">
            Photo Gallery
          </h1>

          <div className="text-xs sm:text-sm md:text-lg font-bold px-2 py-1.5 sm:px-3 sm:py-2 doodle-border bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300 flex-shrink-0">
            <span className="font-tiny5">{photoStrips.length}</span> strip{photoStrips.length !== 1 ? 's' : ''}
          </div>
        </div>

        {photoStrips.length === 0 ? (
          <div className="doodle-border-thick p-6 sm:p-8 md:p-12 text-center sketch-shadow rotate-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
            <FaImage className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-black dark:text-white" />
            <h2 className="text-xl sm:text-2xl md:text-3xl mb-2 font-bold text-black dark:text-white">No photo strips yet</h2>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base md:text-lg font-semibold text-gray-600 dark:text-gray-400">Take some photos to see them here!</p>
            <button
              onClick={() => navigateTo('photobooth')}
              className="font-bold px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 text-sm sm:text-base doodle-button transition-colors flex items-center gap-2 mx-auto bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-300"
            >
              <FaCamera className="w-4 h-4 sm:w-5 sm:h-5" />
              START PHOTO BOOTH
            </button>
          </div>
        ) : (
          <div className="overflow-y-visible pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {photoStrips.map((strip: PhotoStripType, idx: number) => (
                <div key={strip.id} className={`doodle-border-thick p-3 sm:p-4 sketch-shadow m-1 sm:m-2 ${idx % 3 === 0 ? 'rotate-1' : idx % 3 === 1 ? '-rotate-1' : 'rotate-2'} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300`}>
                  {/* Photo Strip Preview */}
                  <div className="bg-white doodle-box p-2 mb-3 shadow-lg max-h-[300px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
                    <div className="space-y-1">
                      {strip.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full doodle-border"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Strip Info */}
                  <div className="text-center mb-2 sm:mb-3">
                    <p className="font-bold text-sm sm:text-base text-black dark:text-white font-tiny5">{strip.date}</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 font-tiny5">{strip.timestamp}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleDownload(strip)}
                      className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 doodle-button transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-300"
                    >
                      <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Download</span>
                      <span className="xs:hidden">Get</span>
                    </button>
                    <button
                      onClick={() => deleteStrip(strip.id)}
                      className="p-1.5 sm:p-2 doodle-button transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300"
                    >
                      <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        {photoStrips.length !== 0 && (
        <div className="mt-4 sm:mt-6 md:mt-8 flex justify-center pb-4">
          <button
            onClick={() => navigateTo('photobooth')}
            className="font-bold px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 text-sm sm:text-base doodle-button transition-colors flex items-center gap-2 -rotate-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-300"
          >
            <FaCamera className="w-4 h-4 sm:w-5 sm:h-5" />
            TAKE MORE PHOTOS
          </button>
        </div>)}
      </div>

      <Footer />

      {/* Instagram Browser Modal */}
      {showInstagramModal && (
        <InstagramModal onClose={() => setShowInstagramModal(false)} />
      )}
    </div>
  );
};
