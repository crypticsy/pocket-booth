import { RefObject } from "react";
import { FaCamera, FaChevronDown, FaRotateLeft } from "react-icons/fa6";
import { FilterType, getCSSFilter } from "../../utils/filters";
import { Stage } from "../../types";

type CaptureSectionProps = {
  captureRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  stage: Stage;
  countdown: number;
  currentPhotoIndex: number;
  showFlash: boolean;
  photoCount: number;
  cameraFacing: string;
  selectedFilter: FilterType;
  cameraError: string;
  startSession: () => void;
  scrollToSection: (index: number) => void;
  retake: () => void;
  startCamera: () => void;
};

export const CaptureSection = ({
  captureRef,
  videoRef,
  stage,
  countdown,
  currentPhotoIndex,
  showFlash,
  photoCount,
  cameraFacing,
  selectedFilter,
  cameraError,
  startSession,
  scrollToSection,
  retake,
  startCamera,
}: CaptureSectionProps) => (
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
                <p className="text-sm" style={{ color: "var(--warm-muted)" }}>
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
            <p className="text-sm font-medium" style={{ color: "var(--cream)" }}>
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
);
