import { FaXmark, FaCamera, FaImage, FaSliders } from 'react-icons/fa6';

type InfoGuideModalProps = {
  onClose: () => void;
};

export const InfoGuideModal = ({ onClose }: InfoGuideModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75">
      <div className="bg-white dark:bg-gray-800 doodle-border-thick max-w-md w-full p-4 sm:p-6 sketch-shadow relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
        >
          <FaXmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 dark:text-gray-200" />
        </button>

        {/* Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📸</div>
          <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-1 sm:mb-2">
            Photo Booth Guide
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 text-center">
            Welcome to Pocket Booth! Here's how to create your photo strip.
          </p>

          {/* Instructions */}
          <div className="space-y-3 sm:space-y-4">
            {/* Step 1 */}
            <div className="doodle-border p-3 sm:p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-black dark:bg-white text-white dark:text-black rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                    <FaSliders className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Choose Your Settings
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    Before taking photos, customize your experience:
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1.5 sm:mt-2 ml-3 sm:ml-4 space-y-0.5 sm:space-y-1 list-disc list-inside">
                    <li><strong>Filter:</strong> Use arrows to preview and select a filter</li>
                    <li><strong>Strip Length:</strong> Pick 1-4 photos for your strip</li>
                    <li><strong>Camera:</strong> Choose front or back camera (mobile)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="doodle-border p-3 sm:p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-black dark:bg-white text-white dark:text-black rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                    <FaCamera className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Insert Coin to Start
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    Click the "INSERT COIN" button to start the photo session. You'll get a 3-second countdown, then photos will be taken automatically with pauses between each shot!
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="doodle-border p-3 sm:p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-black dark:bg-white text-white dark:text-black rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                    <FaImage className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    View & Download
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    After your session, download your photo strip! All photos are automatically saved in the Gallery for later viewing and downloading.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="doodle-border p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30">
            <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
              💡 Pro Tips:
            </p>
            <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-0.5 sm:space-y-1 list-disc list-inside">
              <li>Preview filters in the TV screen before starting</li>
              <li>Try different poses for each photo in your strip</li>
              <li>Make sure you have good lighting for best results</li>
              <li>All your photo strips are saved in the Gallery!</li>
            </ul>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 px-3 sm:px-4 doodle-button transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-300"
          >
            Got It!
          </button>

          {/* Footer note */}
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center mt-3 sm:mt-4">
            You can access this guide anytime by clicking the info icon
          </p>
        </div>
      </div>
    </div>
  );
};
