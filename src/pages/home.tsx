import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCamera,
  FaCameraRotate,
  FaDownload,
  FaImage,
  FaCloudArrowUp,
  FaRotateLeft,
  FaChevronUp,
} from "react-icons/fa6";
import {
  FilterType,
  getCSSFilter,
  getFilterName,
  applyCanvasFilter,
} from "../utils/filters";
import { downloadPhotoStrip } from "../utils/photostrip";
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
import appIcon from "../assets/icon.png";

type PhotoStripType = {
  id: number;
  photos: string[];
  timestamp: string;
  date: string;
};

type HomePageProps = {
  navigateTo: (route: string) => void;
  appState?: any;
  setAppState?: React.Dispatch<React.SetStateAction<any>>;
};

const PREVIEW_IMG =
  "https://img.freepik.com/premium-vector/pixel-art-characters-set-8bit-avatar-funny-faces-80s-nft-cartoon-vector-icon_250257-5371.jpg";

const FILTER_LABELS: Record<FilterType, string> = {
  normal: "Natural",
  blackAndWhite: "B & W",
  cute: "Dreamy",
  film: "Film",
};

// ── Strip preview shown in configure sidebar ─────────────────
const StripPreview = ({
  filter,
  count,
}: {
  filter: FilterType;
  count: number;
}) => (
  <div className="section-enter-right pl-8">
    <p
      className="text-center mb-3 text-xs font-semibold uppercase tracking-widest"
      style={{ color: "var(--warm-muted)", letterSpacing: "0.12em" }}
    >
      Preview
    </p>
    <div
      className="photo-strip transition-all duration-300"
      style={{ maxWidth: 140 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="preview-frame pb-2">
          <img
            src={PREVIEW_IMG}
            alt={`Frame ${i + 1}`}
            style={{ filter: getCSSFilter(filter) }}
          />
        </div>
      ))}
      <div
        className="mt-2 text-center absolute"
        style={{
          fontSize: "0.55rem",
          color: "var(--warm-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Pocket Booth
      </div>
    </div>
  </div>
);

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
  const [isMobile, setIsMobile] = useState(false);

  // ── Camera / capture state ───────────────────────────────────
  type Stage =
    | "idle"
    | "loading"
    | "ready"
    | "countdown"
    | "capturing"
    | "complete";
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

  // ── Section entrance animations (IntersectionObserver) ───────
  useEffect(() => {
    const sections =
      scrollRef.current?.querySelectorAll<HTMLElement>(".booth-section");
    if (!sections) return;

    const heroEl = sections[0];

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Add .is-visible once; never remove it so animations don't replay jankily
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
        // Back-to-top: show whenever hero section is not intersecting
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

  // ── Filter navigation ────────────────────────────────────────
  const filters: FilterType[] = ["normal", "blackAndWhite", "cute", "film"];
  const filterIdx = filters.indexOf(selectedFilter);
  const prevFilter = () =>
    setSelectedFilter(
      filters[(filterIdx - 1 + filters.length) % filters.length],
    );
  const nextFilter = () =>
    setSelectedFilter(filters[(filterIdx + 1) % filters.length]);

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Back to top button ────────────────────────────────── */}
      <button
        onClick={() => scrollToSection(0)}
        className={`back-to-top ${showBackToTop ? "" : "hidden"}`}
        aria-label="Back to top"
      >
        <FaChevronUp className="w-4 h-4" />
      </button>

      {/* ── Main scroll container ─────────────────────────────── */}
      <div ref={scrollRef} className="booth-scroll h-full w-full">
        {/* ════ SECTION 1: HERO ═════════════════════════════════ */}
        <section
          className="booth-section hero-section"
          style={{ background: "var(--cream)" }}
        >
          <div className="flex flex-col flex-1 min-h-0 px-6 text-center relative">
            {/* Gallery link — top right */}
            <div className="absolute top-5 right-5 z-10">
              <button
                onClick={() => navigateTo("gallery")}
                className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{ color: "var(--warm-muted)" }}
              >
                <FaImage className="w-3.5 h-3.5" />
                Gallery
                {(appState?.photoStrips?.length || 0) > 0 && (
                  <span
                    className="text-xs font-semibold rounded-full px-1.5 py-0.5"
                    style={{
                      background: "var(--accent-light)",
                      color: "var(--accent-dark)",
                    }}
                  >
                    {appState.photoStrips.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── Center content ── */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Floating film-hole dots */}
              <div className="flex gap-3 mb-8 opacity-40">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="hero-dot"
                    style={{ width: 9, height: 9 }}
                  />
                ))}
              </div>

              {/* Title + icon wrapper */}
              <div className="relative inline-block">
                {/* Main title */}
                <h1
                  className="font-display section-enter d2 leading-none tracking-tight"
                  style={{
                    fontSize: "clamp(3rem, 12vw, 6rem)",
                    color: "var(--warm-text)",
                  }}
                >
                  Pocket Booth
                </h1>

                {/* Small icon positioned to the right */}
                <img
                  src={appIcon}
                  alt="Pocket Booth"
                  className="section-enter d1 absolute"
                  style={{
                    width: "clamp(32px, 6vw, 48px)",
                    height: "clamp(32px, 6vw, 48px)",
                    objectFit: "contain",
                    right: "-3rem", // adjust spacing from text
                    top: "0%",
                    transform: "translateY(-50%) rotate(40deg)",
                    filter: "drop-shadow(0 4px 12px rgba(196,145,108,0.35))",
                  }}
                />
              </div>

              {/* Accent line */}
              <div className="accent-line mt-4 mb-5 section-enter d3" />

              {/* Tagline */}
              <p
                className="font-body max-w-xs leading-relaxed section-enter d4"
                style={{
                  fontSize: "clamp(1rem, 3.5vw, 1.15rem)",
                  color: "var(--warm-muted)",
                }}
              >
                Capture moments,
                <br />
                one strip at a time.
              </p>
            </div>

            {/* ── Bottom bar: credit + scroll ── */}
            <div className="pb-8 flex flex-col items-center gap-3 section-enter d5">
              <p
                className="text-xs pb-12"
                style={{ color: "var(--warm-muted)" }}
              >
                Made with love by{" "}
                <a
                  href="https://www.animeshbasnet.com.np/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-opacity duration-200 hover:opacity-70"
                >
                  <span
                    className="font-semibold"
                    style={{ color: "var(--warm-text)" }}
                  >
                    Crypticsy
                  </span>
                  <img
                    src="https://github.com/crypticsy.png"
                    alt="Crypticsy"
                    className="w-5 h-5 rounded-full"
                    style={{ border: "1.5px solid rgba(196,145,108,0.5)" }}
                  />
                </a>
              </p>
              <button
                onClick={() => scrollToSection(1)}
                className="flex flex-col items-center gap-2 btn-ghost scroll-indicator"
                style={{ color: "var(--warm-muted)" }}
              >
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ letterSpacing: "0.16em" }}
                >
                  Scroll to begin
                </span>
                <FaChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ════ SECTION 2: CONFIGURE ════════════════════════════ */}
        <section
          className="booth-section configure-section"
          style={{ background: "var(--cream)" }}
        >
          {/* Single centered container — preview lives INSIDE, right of controls */}
          <div className="h-full overflow-y-auto flex justify-center">
            <div
              className="w-full flex flex-col sm:flex-row px-6 py-10 gap-8"
              style={{ maxWidth: 640 }}
            >
              {/* ── Controls column ── */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Heading */}
                <div className="mb-6">
                  <p
                    className="text-xs uppercase font-semibold mb-2 section-enter d1"
                    style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
                  >
                    Step 01
                  </p>
                  <h2
                    className="font-display leading-tight section-enter d2"
                    style={{
                      fontSize: "clamp(1.8rem, 6vw, 2.75rem)",
                      color: "var(--warm-text)",
                    }}
                  >
                    Set the scene.
                  </h2>
                  <div className="accent-line mt-3 section-enter d2" />
                </div>

                {/* Filter selector */}
                <div className="mb-5 section-enter d3">
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--warm-muted)" }}
                  >
                    Choose a filter
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevFilter}
                      className="btn-ghost p-1"
                      style={{ color: "var(--warm-text)" }}
                    >
                      <FaChevronLeft className="w-3 h-3" />
                    </button>
                    <div className="flex-1 grid grid-cols-4 gap-1.5">
                      {filters.map((f) => (
                        <button
                          key={f}
                          onClick={() => setSelectedFilter(f)}
                          className={`filter-card ${selectedFilter === f ? "active" : ""}`}
                        >
                          <img
                            src={PREVIEW_IMG}
                            alt={FILTER_LABELS[f]}
                            className="absolute inset-0 w-full h-full object-cover object-top"
                            style={{ filter: getCSSFilter(f) }}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 py-1 text-center"
                            style={{
                              background:
                                "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                              fontSize: "0.55rem",
                              fontWeight: 600,
                              color: "white",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {FILTER_LABELS[f]}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={nextFilter}
                      className="btn-ghost p-1"
                      style={{ color: "var(--warm-text)" }}
                    >
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Strip length */}
                <div className="mb-5 section-enter d4">
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--warm-muted)" }}
                  >
                    Strip length
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPhotoCount(n)}
                        className={`count-card section-enter-scale d${n} ${photoCount === n ? "active" : ""}`}
                      >
                        <span className="font-display text-xl leading-none">
                          {n}
                        </span>
                        <span
                          className="text-[10px] font-body"
                          style={{
                            color:
                              photoCount === n
                                ? "var(--accent-dark)"
                                : "var(--warm-muted)",
                          }}
                        >
                          {n === 1 ? "photo" : "photos"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camera direction (mobile only) */}
                {isMobile && (
                  <div className="mb-5 section-enter d5">
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: "var(--warm-muted)" }}
                    >
                      Camera
                    </p>
                    <button
                      onClick={() =>
                        setCameraFacing((f) =>
                          f === "user" ? "environment" : "user",
                        )
                      }
                      className="btn-secondary"
                    >
                      <FaCameraRotate className="w-4 h-4" />
                      {cameraFacing === "user" ? "Front camera" : "Back camera"}
                    </button>
                  </div>
                )}

                {/* Photo limit */}
                {isKeyBased && photosRemaining !== undefined && (
                  <div
                    className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{
                      background:
                        photosRemaining === 0
                          ? "#fef2f2"
                          : "var(--accent-light)",
                      color:
                        photosRemaining === 0
                          ? "#b91c1c"
                          : "var(--accent-dark)",
                      border: `1px solid ${photosRemaining === 0 ? "#fecaca" : "var(--border)"}`,
                    }}
                  >
                    {photosRemaining === 0
                      ? "You have reached your upload limit."
                      : `${photosRemaining} upload${photosRemaining !== 1 ? "s" : ""} remaining.`}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: "var(--warm-muted)" }}
                  >
                    {getFilterName(selectedFilter)} · {photoCount} photo
                    {photoCount !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => scrollToSection(2)}
                    className="btn-primary"
                    style={{ padding: "0.75rem 1.5rem" }}
                  >
                    Ready to shoot
                    <FaChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* end controls column */}

              {/* ── Strip preview column — right of controls, always visible ── */}
              <div className="flex-shrink-0 p flex flex-col items-center sm:justify-center section-enter-right">
                <StripPreview filter={selectedFilter} count={photoCount} />
              </div>
            </div>
          </div>
        </section>

        {/* ════ SECTION 3: CAPTURE ══════════════════════════════ */}
        <section
          ref={captureRef}
          className="booth-section capture-section"
          style={{ background: "#1a110a" }}
        >
          <div className="flex flex-col h-full items-center justify-center px-6 py-8 gap-5">
            {/* Step label */}
            <div className="text-center section-enter d1">
              <p
                className="text-xs uppercase font-semibold mb-1"
                style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
              >
                Step 02
              </p>
              <h2
                className="font-display leading-tight"
                style={{
                  fontSize: "clamp(1.8rem, 6vw, 2.75rem)",
                  color: "var(--cream)",
                }}
              >
                {stage === "complete"
                  ? "All done!"
                  : stage === "capturing"
                    ? "Capturing…"
                    : "Smile!"}
              </h2>
            </div>

            {/* Camera frame */}
            <div
              className={`camera-frame w-full section-enter d2 ${stage === "ready" ? "ready" : ""}`}
              style={{ maxWidth: 340 }}
            >
              {/* Live video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: cameraFacing === "user" ? "scaleX(-1)" : "none",
                  filter: getCSSFilter(selectedFilter),
                  display: stage === "complete" ? "none" : "block",
                  transition: "filter 0.4s ease",
                }}
              />

              {/* Loading / idle */}
              {(stage === "idle" || stage === "loading") && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: "#1a110a" }}
                >
                  {stage === "loading" ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-full border-2 animate-spin"
                        style={{
                          borderColor: "var(--accent)",
                          borderTopColor: "transparent",
                        }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: "var(--warm-muted)" }}
                      >
                        Starting camera…
                      </p>
                    </>
                  ) : cameraError ? (
                    <p
                      className="text-sm text-center px-4"
                      style={{ color: "#fc8181" }}
                    >
                      {cameraError}
                    </p>
                  ) : (
                    <FaCamera
                      className="w-8 h-8 opacity-20"
                      style={{ color: "var(--cream)" }}
                    />
                  )}
                </div>
              )}

              {/* Countdown overlay */}
              {stage === "countdown" && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.48)" }}
                >
                  <span
                    key={countdown}
                    className="font-display"
                    style={{
                      fontSize: "7rem",
                      color: "white",
                      lineHeight: 1,
                      animation:
                        "countPop 0.95s cubic-bezier(0.22,1,0.36,1) forwards",
                    }}
                  >
                    {countdown === 0 ? "!" : countdown}
                  </span>
                </div>
              )}

              {/* Photo counter badge */}
              {stage === "capturing" && (
                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <div
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    Photo {currentPhotoIndex} of {photoCount}
                  </div>
                </div>
              )}

              {/* Flash */}
              {showFlash && (
                <div
                  className="absolute inset-0 bg-white pointer-events-none"
                  style={{ animation: "flash 0.15s ease-out" }}
                />
              )}

              {/* Complete state */}
              {stage === "complete" && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: "#1a110a" }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: "var(--accent-light)",
                      color: "var(--accent-dark)",
                    }}
                  >
                    ✓
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--cream)" }}
                  >
                    {photoCount} photo{photoCount !== 1 ? "s" : ""} taken
                  </p>
                </div>
              )}
            </div>

            {/* Progress dots */}
            {(stage === "capturing" || stage === "countdown") && (
              <div className="flex gap-2">
                {Array.from({ length: photoCount }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-400"
                    style={{
                      width: 8,
                      height: 8,
                      background:
                        i < currentPhotoIndex
                          ? "var(--accent)"
                          : i === currentPhotoIndex && stage === "capturing"
                            ? "rgba(255,255,255,0.55)"
                            : "rgba(255,255,255,0.15)",
                      transform:
                        i === currentPhotoIndex && stage === "capturing"
                          ? "scale(1.3)"
                          : "scale(1)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-3 w-full max-w-[280px] section-enter d3">
              {stage === "ready" && (
                <button onClick={startSession} className="btn-primary w-full">
                  <FaCamera className="w-4 h-4" />
                  Start session
                </button>
              )}

              {stage === "complete" && (
                <>
                  <button
                    onClick={() => scrollToSection(3)}
                    className="btn-light w-full"
                  >
                    See your strip
                    <FaChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={retake}
                    className="btn-ghost"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    <FaRotateLeft className="w-3.5 h-3.5" />
                    Retake
                  </button>
                </>
              )}

              {(stage === "loading" || stage === "idle") && !cameraError && (
                <p
                  className="text-xs text-center"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                >
                  Camera initialising…
                </p>
              )}

              {cameraError && (
                <button onClick={startCamera} className="btn-light">
                  <FaCamera className="w-3.5 h-3.5" />
                  Retry camera
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ════ SECTION 4: RESULTS ══════════════════════════════ */}
        <section
          className="booth-section results-section"
          style={{ background: "var(--cream)" }}
        >
          <div className="flex flex-col h-full px-6 py-10 max-w-lg mx-auto w-full">
            {/* Heading */}
            <div className="mb-6">
              <p
                className="text-xs uppercase font-semibold mb-2 section-enter d1"
                style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
              >
                Step 03
              </p>
              <h2
                className="font-display leading-tight section-enter d2"
                style={{
                  fontSize: "clamp(2rem, 7vw, 3rem)",
                  color: "var(--warm-text)",
                }}
              >
                {photoStrip ? "Your strip." : "No strips yet."}
              </h2>
              <div className="accent-line mt-3 section-enter d2" />
            </div>

            {photoStrip ? (
              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start flex-1 overflow-y-auto">
                {/* Strip preview */}
                <div className="slide-in-strip flex-shrink-0">
                  <div className="photo-strip" style={{ maxWidth: 170 }}>
                    {photoStrip.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Photo ${i + 1}`} />
                    ))}
                    <div
                      className="mt-2 text-center uppercase"
                      style={{
                        fontSize: "0.55rem",
                        color: "var(--warm-muted)",
                        letterSpacing: "0.14em",
                      }}
                    >
                      Pocket Booth · {photoStrip.date}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full sm:flex-1 items-stretch section-enter d3">
                  <button
                    onClick={() =>
                      downloadPhotoStrip(
                        photoStrip.photos,
                        `photo-strip-${photoStrip.id}.jpg`,
                      )
                    }
                    className="btn-primary"
                  >
                    <FaDownload className="w-4 h-4" />
                    Download strip
                  </button>

                  {showUploadButton && (
                    <button
                      onClick={handleUpload}
                      disabled={uploadStatus === "uploading" || isLimitReached}
                      className="btn-secondary"
                      style={{
                        opacity:
                          uploadStatus === "uploading" || isLimitReached
                            ? 0.5
                            : 1,
                        cursor:
                          uploadStatus === "uploading" || isLimitReached
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <FaCloudArrowUp
                        className={`w-4 h-4 ${uploadStatus === "uploading" ? "animate-pulse" : ""}`}
                      />
                      {isLimitReached
                        ? "Limit reached"
                        : uploadStatus === "uploading"
                          ? "Uploading…"
                          : uploadStatus === "success"
                            ? "Uploaded!"
                            : "Upload"}
                    </button>
                  )}

                  {uploadMessage && (
                    <p
                      className="text-xs"
                      style={{
                        color:
                          uploadStatus === "error"
                            ? "#b91c1c"
                            : "var(--accent-dark)",
                      }}
                    >
                      {uploadMessage}
                    </p>
                  )}

                  <div
                    className="border-t pt-3 mt-1 flex flex-col gap-2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button onClick={retake} className="btn-secondary">
                      <FaRotateLeft className="w-3.5 h-3.5" />
                      Take another
                    </button>
                    <button
                      onClick={() => navigateTo("gallery")}
                      className="btn-ghost"
                      style={{ color: "var(--warm-muted)" }}
                    >
                      <FaImage className="w-3.5 h-3.5" />
                      View all strips
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center section-enter d3">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--cream-surface)" }}
                >
                  <FaCamera
                    className="w-8 h-8"
                    style={{ color: "var(--border)" }}
                  />
                </div>
                <div>
                  <p
                    className="font-display text-xl mb-2"
                    style={{ color: "var(--warm-text)" }}
                  >
                    Scroll up to take photos
                  </p>
                  <p className="text-sm" style={{ color: "var(--warm-muted)" }}>
                    Your strip will appear here once you're done shooting.
                  </p>
                </div>
                <button
                  onClick={() => scrollToSection(2)}
                  className="btn-primary"
                >
                  <FaCamera className="w-4 h-4" />
                  Go to camera
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      {/* end booth-scroll */}
    </>
  );
};
