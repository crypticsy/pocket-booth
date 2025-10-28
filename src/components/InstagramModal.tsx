import { FaExternalLinkAlt, FaCopy, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

type InstagramModalProps = {
  onClose: () => void;
};

export const InstagramModal = ({ onClose }: InstagramModalProps) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;

  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openInBrowser = () => {
    // Try to open in default browser (works on some platforms)
    window.location.href = currentUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 doodle-border-thick max-w-md w-full p-6 sketch-shadow relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <FaTimes className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">📱</div>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
            Open in Browser
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-center">
            Instagram's browser doesn't support downloads. Please open this page in Safari or Chrome to download your photos.
          </p>

          {/* Instructions */}
          <div className="doodle-border p-4 bg-gray-50 dark:bg-gray-700">
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-2">
              How to open in browser:
            </p>
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
              <li>Tap the <strong>three dots (...)</strong> menu above</li>
              <li>Select <strong>"Open in Safari"</strong> or <strong>"Open in Chrome"</strong></li>
              <li>Download your photos from there!</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={copyUrl}
              className="w-full py-3 px-4 doodle-button transition-colors flex items-center justify-center gap-2 text-sm font-bold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-300"
            >
              <FaCopy className="w-4 h-4" />
              {copied ? 'URL Copied!' : 'Copy Page URL'}
            </button>

            <button
              onClick={openInBrowser}
              className="w-full py-3 px-4 doodle-button transition-colors flex items-center justify-center gap-2 text-sm font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300"
            >
              <FaExternalLinkAlt className="w-4 h-4" />
              Try Opening in Browser
            </button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            This is a limitation of Instagram's in-app browser. Your photos are saved in the gallery!
          </p>
        </div>
      </div>
    </div>
  );
};
