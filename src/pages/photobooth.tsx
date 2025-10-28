import { useState, useEffect } from 'react';
import { FaCamera, FaArrowLeft, FaDownload, FaCloudArrowUp } from 'react-icons/fa6';
import { Footer } from '../components/Footer';
import { FilterType, getCSSFilter, applyCanvasFilter } from '../utils/filters';
import { downloadPhotoStrip } from '../utils/photostrip';
import { incrementPhotoCount } from '../utils/configManager';
import { uploadPhotoStripToGoogleDrive, isUploadConfigured } from '../utils/googleDriveUpload';
import { hasReachedPhotoLimit, isKeyBasedConfig, getCurrentConfigKey } from '../utils/configManager';

type PhotoBoothProps = {
  navigateTo: (route: string) => void;
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  refs: {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
  };
};

type PhotoStripType = {
  id: number;
  photos: string[];
  timestamp: string;
  date: string;
};

export const PhotoBoothPage = ({ navigateTo, appState, setAppState, refs }: PhotoBoothProps) => {
  const [stage, setStage] = useState<'loading' | 'countdown' | 'capturing' | 'complete'>('loading');
  const [countdown, setCountdown] = useState(0);
  const [photoStrip, setPhotoStrip] = useState<PhotoStripType | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const photoCount = appState?.photoCount || 4;
  const cameraFacing = appState?.cameraFacing || 'user';
  const shouldMirror = cameraFacing === 'user';
  const debugCamera = appState?.debugCamera || false;
  const selectedFilter = (appState?.selectedFilter as FilterType) || 'normal';
  const uploadConfigured = isUploadConfigured();
  const isKeyBased = isKeyBasedConfig();
  const showUploadButton = uploadConfigured && isKeyBased;
  const isLimitReached = hasReachedPhotoLimit();

  useEffect(() => {
    let streamRef: MediaStream | null = null;

    const initCamera = async () => {
      // Skip camera initialization if debug mode is enabled
      if (debugCamera) {
        console.log('Debug mode: Skipping camera initialization');
        setCameraReady(true);
        return;
      }

      try {
        const cameraFacing = appState?.cameraFacing || 'user';
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: cameraFacing
          },
          audio: false
        });
        streamRef = stream;
        setAppState((prev: typeof appState) => ({ ...prev, myStream: stream }));
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please allow camera permissions.');
      }
    };

    initCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      console.log('Cleaning up camera...');
      if (streamRef) {
        streamRef.getTracks().forEach((track: MediaStreamTrack) => {
          console.log('Stopping track:', track.label);
          track.stop();
        });
        streamRef = null;
      }
      // Also stop any stream in appState
      setAppState((prev: typeof appState) => {
        if (prev.myStream) {
          prev.myStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        return { ...prev, myStream: null };
      });
    };
  }, []);

  useEffect(() => {
    if (appState.myStream && refs.videoRef.current) {
      const video = refs.videoRef.current;

      console.log('Setting video stream', appState.myStream);
      video.srcObject = appState.myStream;

      // Force video to play
      video.play().catch(err => console.error('Error playing video:', err));

      // Wait for video to be ready before starting
      const handleCanPlay = () => {
        console.log('Video can play, dimensions:', video.videoWidth, video.videoHeight);
        setCameraReady(true);
      };

      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [appState.myStream, refs.videoRef, stage]);

  // Auto-start countdown when camera is ready
  useEffect(() => {
    if (cameraReady && stage === 'loading') {
      setTimeout(() => {
        setStage('countdown');
        setCountdown(3);
      }, 1000);
    }
  }, [cameraReady, stage]);

  const stopCamera = () => {
    console.log('=== stopCamera called ===');

    // Stop video element srcObject FIRST
    if (refs.videoRef.current) {
      const video = refs.videoRef.current;
      if (video.srcObject) {
        console.log('Stopping video.srcObject tracks');
        const videoTracks = (video.srcObject as MediaStream).getTracks();
        videoTracks.forEach(track => {
          console.log('Stopping video track:', track.label, 'state:', track.readyState);
          track.stop();
          console.log('Video track after stop:', track.readyState);
        });
        video.srcObject = null;
        console.log('video.srcObject set to null');
      }
    }

    // Then stop appState.myStream
    if (appState.myStream) {
      console.log('Stopping appState.myStream tracks');
      const stateTracks = appState.myStream.getTracks();
      stateTracks.forEach((track: MediaStreamTrack) => {
        console.log('Stopping state track:', track.label, 'state:', track.readyState);
        track.stop();
        console.log('State track after stop:', track.readyState);
      });
    }

    // Clear from appState
    setAppState((prev: typeof appState) => ({ ...prev, myStream: null }));
    console.log('=== stopCamera complete ===');
  };

  const playShutterSound = () => {
    // Create 8-bit retro camera shutter sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // 8-bit click sound (square wave)
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // Second 8-bit blip
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(440, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(220, now + 0.1);
    gain2.gain.setValueAtTime(0.2, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.1);
  };


  const takePhoto = () => {
    const canvas = refs.canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not available');
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available');
      return null;
    }

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    // Shutter sound
    playShutterSound();

    // Debug mode: Generate placeholder image
    if (debugCamera) {
      const size = 800;
      canvas.width = size;
      canvas.height = size;

      // Generate a gradient background
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
      const colorIndex = currentPhotoIndex % colors.length;
      gradient.addColorStop(0, colors[colorIndex]);
      gradient.addColorStop(1, colors[(colorIndex + 1) % colors.length]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Add text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`DEBUG PHOTO ${currentPhotoIndex}`, size / 2, size / 2);
      ctx.font = '30px Arial';
      ctx.fillText(new Date().toLocaleTimeString(), size / 2, size / 2 + 60);

      return canvas.toDataURL('image/jpeg', 0.9);
    }

    // Normal mode: Capture from video
    if (!refs.videoRef.current) {
      console.error('Video ref not available');
      return null;
    }

    const video = refs.videoRef.current;

    // Check if video is actually playing
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('Video not ready');
      return null;
    }

    // Calculate square crop dimensions (center crop)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const size = Math.min(videoWidth, videoHeight);

    // Calculate crop position (center)
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;

    // Set canvas to square
    canvas.width = size;
    canvas.height = size;

    // Flip the image horizontally (mirror effect) only for front camera
    const cameraFacing = appState?.cameraFacing || 'user';
    if (cameraFacing === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    // Draw cropped square image
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    // Reset transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Apply selected filter to the canvas
    applyCanvasFilter(canvas, selectedFilter);

    return canvas.toDataURL('image/jpeg', 0.9);
  };


  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (stage === 'countdown' && countdown === 0) {
      setStage('capturing');
      capturePhotoSequence();
    }
  }, [stage, countdown]);

  const capturePhotoSequence = async () => {
    const photos: string[] = [];

    for (let i = 0; i < photoCount; i++) {
      setCurrentPhotoIndex(i + 1);
      await new Promise(resolve => setTimeout(resolve, 500));

      const photoData = takePhoto();
      if (photoData) {
        photos.push(photoData);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const strip: PhotoStripType = {
      id: Date.now(),
      photos: photos,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };

    setPhotoStrip(strip);
    setAppState((prev: typeof appState) => ({
      ...prev,
      photoStrips: [...prev.photoStrips, strip]
    }));

    // Stop camera after photos are taken
    stopCamera();

    setStage('complete');
  };

  const handleDownloadStrip = () => {
    if (!photoStrip) return;
    downloadPhotoStrip(photoStrip.photos, `photo-strip-${photoStrip.id}.jpg`);
  };

  const handleUploadToGoogleDrive = async () => {
    if (!photoStrip) return;

    setUploadStatus('uploading');
    setUploadMessage('Uploading photo strip to Google Drive...');

    try {
      // Get current key to send to backend
      const currentKey = getCurrentConfigKey();

      // Upload the photo strip as a single combined image
      const result = await uploadPhotoStripToGoogleDrive(
        photoStrip.photos,
        `photo-strip-${photoStrip.id}`,
        currentKey
      );

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage('Successfully uploaded photo strip!');
        // Increment the photo count only after successful upload
        incrementPhotoCount();
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const reset = () => {
    console.log('Reset called - stopping camera first');

    // Stop camera before reinitializing
    stopCamera();

    setStage('loading');
    setPhotoStrip(null);
    setCurrentPhotoIndex(0);
    setCountdown(3);
    setCameraReady(false);

    // Reinitialize camera after a brief delay to ensure cleanup is complete
    setTimeout(async () => {
      // Skip camera initialization if debug mode is enabled
      if (appState?.debugCamera) {
        console.log('Debug mode: Skipping camera reinitialization');
        return;
      }

      try {
        console.log('Reinitializing camera...');
        const cameraFacing = appState?.cameraFacing || 'user';
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: cameraFacing
          },
          audio: false
        });
        setAppState((prev: typeof appState) => ({ ...prev, myStream: stream }));
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please allow camera permissions.');
      }
    }, 100);
  };

  return (
    <div
      className="w-full overflow-y-auto bg-white dark:bg-gray-900 text-black dark:text-white fixed inset-0"
      style={{
        height: 'var(--viewport-height, 100vh)',
        minHeight: '-webkit-fill-available',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-2">
          <button
            onClick={() => {
              stopCamera();
              navigateTo('home');
            }}
            className="transition-colors flex items-center gap-1 sm:gap-2 doodle-button px-2 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300 flex-shrink-0"
          >
            <FaArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm md:text-lg font-bold font-micro hidden sm:inline">Back</span>
          </button>

          <h1 className="text-sm sm:text-base md:text-lg font-bold wavy-underline text-center text-black dark:text-white flex-shrink">
            Photo Booth
          </h1>

          <button
            onClick={() => {
              stopCamera();
              navigateTo('gallery');
            }}
            className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 doodle-button transition-colors text-xs sm:text-sm md:text-lg font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300 font-micro flex-shrink-0"
          >
            <span className="hidden sm:inline">Gallery <span className="font-tiny5">({appState.photoStrips?.length || 0})</span></span>
            <span className="sm:hidden font-tiny5">({appState.photoStrips?.length || 0})</span>
          </button>
        </div>

        {stage === 'loading' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Camera Loading */}
            <div className="doodle-border-thick p-3 sm:p-4 md:p-6 sketch-shadow rotate-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
              <div className="bg-gray-900 doodle-box p-4 relative">
                <div className="aspect-square relative overflow-hidden doodle-border">
                  {debugCamera ? (
                    /* Debug Mode Placeholder */
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                      <div className="text-center">
                        <p className="text-white text-2xl font-bold">DEBUG MODE</p>
                        <p className="text-white text-sm mt-2">No camera required</p>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={refs.videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) scaleX(${shouldMirror ? -1 : 1})`,
                        minWidth: '100%',
                        minHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'cover',
                        filter: getCSSFilter(selectedFilter)
                      }}
                      className="bg-black"
                    />
                  )}
                  {/* Flash overlay for camera only */}
                  {showFlash && (
                    <div className="absolute inset-0 bg-white z-10 pointer-events-none" style={{ animation: 'flash 0.15s ease-out' }} />
                  )}
                </div>
              </div>

              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold animate-pulse text-black dark:text-white">
                  {debugCamera ? 'DEBUG MODE READY' : 'LOADING CAMERA...'}
                </p>
                {appState.myStream && !debugCamera && (
                  <p className="text-sm sm:text-base mt-2 font-semibold text-gray-600 dark:text-gray-400">Stream active: {appState.myStream.active ? 'Yes' : 'No'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {stage === 'countdown' && (
          <div className="doodle-border-thick p-3 sm:p-4 md:p-6 sketch-shadow -rotate-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
            <div className="bg-gray-900 doodle-box p-4 relative">
              <div className="aspect-square relative overflow-hidden doodle-border">
                {debugCamera ? (
                  /* Debug Mode Placeholder */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-green-500">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-5">
                      <div className="text-white text-6xl sm:text-7xl md:text-9xl font-bold font-tiny5 animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={refs.videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) scaleX(${shouldMirror ? -1 : 1})`,
                        minWidth: '100%',
                        minHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'cover',
                        filter: getCSSFilter(selectedFilter)
                      }}
                      className="bg-black"
                    />
                    {/* Flash overlay for camera only */}
                    {showFlash && (
                      <div className="absolute inset-0 bg-white z-10 pointer-events-none" style={{ animation: 'flash 0.15s ease-out' }} />
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-5">
                      <div className="text-white text-6xl sm:text-7xl md:text-9xl font-bold font-tiny5 animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white">
                GET READY!
              </p>
            </div>
          </div>
        )}

        {stage === 'capturing' && (
          <div className="doodle-border-thick p-3 sm:p-4 md:p-6 sketch-shadow rotate-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
            <div className="bg-gray-900 doodle-box p-4 relative">
              <div className="aspect-square relative overflow-hidden doodle-border">
                {debugCamera ? (
                  /* Debug Mode Placeholder */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
                    <div className="absolute top-4 sm:top-6 md:top-8 left-0 right-0 flex justify-center z-5">
                      <div className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 doodle-button font-bold text-sm sm:text-base md:text-xl border-2 sm:border-3 md:border-4 border-black">
                        PHOTO <span className="font-tiny5">{currentPhotoIndex}</span> OF <span className="font-tiny5">{photoCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={refs.videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) scaleX(${shouldMirror ? -1 : 1})`,
                        minWidth: '100%',
                        minHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'cover',
                        filter: getCSSFilter(selectedFilter)
                      }}
                      className="bg-black"
                    />
                    {/* Flash overlay for camera only */}
                    {showFlash && (
                      <div className="absolute inset-0 bg-white z-10 pointer-events-none" style={{ animation: 'flash 0.15s ease-out' }} />
                    )}

                    <div className="absolute top-4 sm:top-6 md:top-8 left-0 right-0 flex justify-center z-5">
                      <div className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 doodle-button font-bold text-sm sm:text-base md:text-xl border-2 sm:border-3 md:border-4 border-black">
                        PHOTO <span className="font-tiny5">{currentPhotoIndex}</span> OF <span className="font-tiny5">{photoCount}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={`mt-3 sm:mt-4 grid gap-1.5 sm:gap-2`} style={{ gridTemplateColumns: `repeat(${photoCount}, minmax(0, 1fr))` }}>
              {Array.from({ length: photoCount }, (_, i) => i + 1).map((num) => (
                <div
                  key={num}
                  className={`h-2 sm:h-3 doodle-border ${
                    num < currentPhotoIndex
                      ? 'bg-black'
                      : num === currentPhotoIndex
                      ? 'bg-gray-600 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {stage === 'complete' && photoStrip && (
          <div className="space-y-4 sm:space-y-6">
            <div className="doodle-border-thick p-3 sm:p-4 md:p-6 sketch-shadow -rotate-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center wavy-underline text-black dark:text-white">
                YOUR PHOTO STRIP!
              </h2>

              <div className="max-w-[200px] sm:max-w-[240px] mx-auto bg-gray-100 doodle-box p-2 sm:p-3 shadow-2xl max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                <div className="space-y-2">
                  {photoStrip.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full doodle-border"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
                {/* Google Drive upload section - show first with valid key */}
                {showUploadButton && (
                  <div>
                    <button
                      onClick={handleUploadToGoogleDrive}
                      disabled={uploadStatus === 'uploading' || isLimitReached}
                      className={`w-full font-bold py-2 px-4 sm:py-2.5 sm:px-6 text-sm sm:text-base doodle-button transition-colors flex items-center justify-center gap-2 ${
                        uploadStatus === 'uploading' || isLimitReached
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                          : uploadStatus === 'success'
                          ? 'bg-green-500 dark:bg-green-600'
                          : uploadStatus === 'error'
                          ? 'bg-red-500 dark:bg-red-600'
                          : 'bg-blue-500 dark:bg-blue-600'
                      } text-white border-blue-600 dark:border-blue-700`}
                    >
                      <FaCloudArrowUp className={`w-4 h-4 sm:w-5 sm:h-5 ${uploadStatus === 'uploading' ? 'animate-pulse' : ''}`} />
                      {isLimitReached ? 'Upload Limit Reached' : uploadStatus === 'uploading' ? 'Uploading...' : uploadStatus === 'success' ? 'Uploaded!' : 'Upload to Google Drive'}
                    </button>

                    {/* Upload status message */}
                    {uploadMessage && (
                      <p className={`text-xs sm:text-sm mt-2 text-center ${
                        uploadStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                        uploadStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {uploadMessage}
                      </p>
                    )}
                  </div>
                )}

                {/* Main action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={handleDownloadStrip}
                    className="font-bold py-2 px-4 sm:py-2.5 sm:px-6 md:py-3 md:px-8 text-sm sm:text-base md:text-lg doodle-button transition-colors flex items-center justify-center gap-2 rotate-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-300"
                  >
                    <FaDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                    Download Strip
                  </button>

                  <button
                    onClick={reset}
                    className="font-bold py-2 px-4 sm:py-2.5 sm:px-6 md:py-3 md:px-8 text-sm sm:text-base md:text-lg doodle-button transition-colors flex items-center justify-center gap-2 -rotate-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-300"
                  >
                    <FaCamera className="w-4 h-4 sm:w-5 sm:h-5" />
                    Take Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
