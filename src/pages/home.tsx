import { useState, useEffect, useRef, useCallback } from "react";
import { FaChevronUp } from "react-icons/fa6";
import { FilterType, applyCanvasFilter } from "../utils/filters";
import {
  incrementPhotoCount,
  isKeyBasedConfig,
  getPhotosRemaining,
  hasReachedPhotoLimit,
  getCurrentConfigKey,
} from "../utils/configManager";
import {
  uploadPhotoStripToGoogleDrive,
  isUploadConfigured,
} from "../utils/googleDriveUpload";
import { PhotoStripType, Stage, StripStyle } from "../types";
import { HeroSection } from "../components/home/HeroSection";
import { ConfigureSection } from "../components/home/ConfigureSection";
import { CaptureSection } from "../components/home/CaptureSection";
import { ResultsSection } from "../components/home/ResultsSection";

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
  // ── Refs ──────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Config state ─────────────────────────────────────────────
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(
    (localStorage.getItem("selectedFilter") as FilterType) || "normal",
  );
  const [photoCount, setPhotoCount] = useState(
    parseInt(localStorage.getItem("photoCount") || "4"),
  );
  const [cameraFacing, setCameraFacing] = useState(
    localStorage.getItem("cameraFacing") || "user",
  );
  const [stripStyle, setStripStyle] = useState<StripStyle>(() => {
    const saved = localStorage.getItem("stripStyle");
    return saved === "white" || saved === "black" ? saved : "white";
  });
  const [isMobile, setIsMobile] = useState(false);

  // ── Camera / capture state ───────────────────────────────────
  const [stage, setStage] = useState<Stage>("idle");
  const [countdown, setCountdown] = useState(3);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [photoStrip, setPhotoStrip] = useState<PhotoStripType | null>(null);
  const [cameraError, setCameraError] = useState("");

  // ── Upload state ─────────────────────────────────────────────
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  // ── UI state ─────────────────────────────────────────────────
  const [showBackToTop, setShowBackToTop] = useState(false);

  const stageRef = useRef<Stage>("idle");
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const uploadConfigured = isUploadConfigured();
  const isKeyBased = isKeyBasedConfig();
  const showUploadButton = uploadConfigured && isKeyBased;
  const isLimitReached = hasReachedPhotoLimit();
  const photosRemaining = getPhotosRemaining();

  // ── Mobile detection + persist config ───────────────────────
  useEffect(() => {
    setIsMobile(
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase(),
      ),
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedFilter", selectedFilter);
  }, [selectedFilter]);
  useEffect(() => {
    localStorage.setItem("photoCount", photoCount.toString());
  }, [photoCount]);
  useEffect(() => {
    localStorage.setItem("cameraFacing", cameraFacing);
  }, [cameraFacing]);
  useEffect(() => {
    localStorage.setItem("stripStyle", stripStyle);
  }, [stripStyle]);

  // ── Section entrance animations (IntersectionObserver) ───────
  useEffect(() => {
    const sections =
      scrollRef.current?.querySelectorAll<HTMLElement>(".booth-section");
    if (!sections) return;

    const heroEl = sections[0];

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
        const heroIntersecting = Array.from(entries).some(
          (e) => e.target === heroEl && e.isIntersecting,
        );
        if (Array.from(entries).some((e) => e.target === heroEl)) {
          setShowBackToTop(!heroIntersecting);
        }
      },
      { threshold: 0.35 },
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // ── Scroll utility ───────────────────────────────────────────
  const scrollToSection = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const sections =
      scrollRef.current.querySelectorAll<HTMLElement>(".booth-section");
    sections[index]?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Camera helpers ───────────────────────────────────────────
  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setStage("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: cameraFacing },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      setStage("ready");
    } catch {
      setCameraError(
        "Camera access denied. Please allow camera permissions and refresh.",
      );
      setStage("idle");
    }
  }, [cameraFacing]);

  // ── IntersectionObserver: camera lifecycle ───────────────────
  useEffect(() => {
    const el = captureRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const s = stageRef.current;
        if (entry.isIntersecting && s === "idle") startCamera();
        else if (!entry.isIntersecting && (s === "loading" || s === "ready")) {
          stopCamera();
          setStage("idle");
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [startCamera, stopCamera]);

  // ── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setStage("capturing");
    runCaptureSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, countdown]);

  // ── Shutter sound ────────────────────────────────────────────
  const playShutter = () => {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  };

  // ── Capture ──────────────────────────────────────────────────
  const takePhoto = (): string | null => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < video.HAVE_ENOUGH_DATA)
      return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);
    playShutter();

    const vw = video.videoWidth,
      vh = video.videoHeight;
    const size = Math.min(vw, vh);
    canvas.width = size;
    canvas.height = size;
    if (cameraFacing === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      video,
      (vw - size) / 2,
      (vh - size) / 2,
      size,
      size,
      0,
      0,
      size,
      size,
    );
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    applyCanvasFilter(canvas, selectedFilter);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const runCaptureSequence = async () => {
    const photos: string[] = [];
    for (let i = 0; i < photoCount; i++) {
      setCurrentPhotoIndex(i + 1);
      await new Promise((r) => setTimeout(r, 500));
      const photo = takePhoto();
      if (photo) photos.push(photo);
      await new Promise((r) => setTimeout(r, 2000));
    }
    stopCamera();
    const strip: PhotoStripType = {
      id: Date.now(),
      photos,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
    };
    setPhotoStrip(strip);
    setAppState?.((prev: any) => ({
      ...prev,
      photoStrips: [...(prev.photoStrips || []), strip],
    }));
    setStage("complete");
    setTimeout(() => scrollToSection(3), 750);
  };

  // ── Session controls ─────────────────────────────────────────
  const startSession = () => {
    setCountdown(3);
    setCurrentPhotoIndex(0);
    setStage("countdown");
  };

  const retake = () => {
    setPhotoStrip(null);
    setStage("idle");
    setUploadStatus("idle");
    setUploadMessage("");
    scrollToSection(2);
    setTimeout(() => startCamera(), 600);
  };

  // ── Upload ───────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!photoStrip) return;
    setUploadStatus("uploading");
    try {
      const result = await uploadPhotoStripToGoogleDrive(
        photoStrip.photos,
        `photo-strip-${photoStrip.id}`,
        getCurrentConfigKey(),
      );
      if (result.success) {
        setUploadStatus("success");
        setUploadMessage("Uploaded successfully!");
        incrementPhotoCount();
      } else {
        setUploadStatus("error");
        setUploadMessage(result.error || "Upload failed");
      }
    } catch {
      setUploadStatus("error");
      setUploadMessage("Upload failed");
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Back to top button */}
      <button
        onClick={() => scrollToSection(0)}
        className={`back-to-top ${showBackToTop ? "" : "hidden"}`}
        aria-label="Back to top"
      >
        <FaChevronUp className="w-4 h-4" />
      </button>

      {/* Main scroll container */}
      <div ref={scrollRef} className="booth-scroll h-full w-full">
        <HeroSection
          navigateTo={navigateTo}
          photoStripsCount={appState?.photoStrips?.length || 0}
          scrollToSection={scrollToSection}
        />

        <ConfigureSection
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          photoCount={photoCount}
          setPhotoCount={setPhotoCount}
          cameraFacing={cameraFacing}
          setCameraFacing={setCameraFacing}
          stripStyle={stripStyle}
          setStripStyle={setStripStyle}
          isMobile={isMobile}
          isKeyBased={isKeyBased}
          photosRemaining={photosRemaining}
          scrollToSection={scrollToSection}
        />

        <CaptureSection
          captureRef={captureRef}
          videoRef={videoRef}
          stage={stage}
          countdown={countdown}
          currentPhotoIndex={currentPhotoIndex}
          showFlash={showFlash}
          photoCount={photoCount}
          cameraFacing={cameraFacing}
          selectedFilter={selectedFilter}
          cameraError={cameraError}
          startSession={startSession}
          scrollToSection={scrollToSection}
          retake={retake}
          startCamera={startCamera}
        />

        <ResultsSection
          photoStrip={photoStrip}
          stripStyle={stripStyle}
          uploadStatus={uploadStatus}
          uploadMessage={uploadMessage}
          showUploadButton={showUploadButton}
          isLimitReached={isLimitReached}
          handleUpload={handleUpload}
          retake={retake}
          navigateTo={navigateTo}
          scrollToSection={scrollToSection}
        />
      </div>
    </>
  );
};
