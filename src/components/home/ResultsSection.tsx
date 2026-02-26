import {
  FaCamera,
  FaDownload,
  FaImage,
  FaCloudArrowUp,
  FaRotateLeft,
} from "react-icons/fa6";
import { downloadPhotoStrip } from "../../utils/photostrip";
import { PhotoStripType, StripStyle, STRIP_STYLES } from "../../types";

type ResultsSectionProps = {
  photoStrip: PhotoStripType | null;
  stripStyle: StripStyle;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadMessage: string;
  showUploadButton: boolean;
  isLimitReached: boolean;
  handleUpload: () => void;
  retake: () => void;
  navigateTo: (route: string) => void;
  scrollToSection: (index: number) => void;
};

export const ResultsSection = ({
  photoStrip,
  stripStyle,
  uploadStatus,
  uploadMessage,
  showUploadButton,
  isLimitReached,
  handleUpload,
  retake,
  navigateTo,
  scrollToSection,
}: ResultsSectionProps) => {
  const style = STRIP_STYLES[stripStyle];

  return (
    <section
      className="booth-section results-section"
      style={{ background: "var(--cream)" }}
    >
      <div className="flex flex-col h-full px-4 sm:px-6 py-6 sm:py-10 max-w-lg mx-auto w-full">
        {/* Heading */}
        <div className="mb-4">
          <p
            className="text-xs uppercase font-semibold mb-1.5 section-enter d1"
            style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
          >
            Step 03
          </p>
          <h2
            className="font-display leading-tight section-enter d2"
            style={{
              fontSize: "clamp(1.6rem, 6vw, 3rem)",
              color: "var(--warm-text)",
            }}
          >
            {photoStrip ? "Your strip." : "No strips yet."}
          </h2>
          <div className="accent-line mt-2.5 section-enter d2" />
        </div>

        {photoStrip ? (
          /* Always row: strip on left, actions on right */
          <div className="flex flex-row gap-4 sm:gap-8 items-start flex-1 min-h-0">
            {/* Strip preview — scrollable if taller than viewport */}
            <div
              className="slide-in-strip flex-shrink-0 overflow-y-auto"
              style={{ maxHeight: "100%" }}
            >
              <div
                className="photo-strip"
                style={{
                  maxWidth: 110,
                  background: style.bg,
                  boxShadow:
                    stripStyle === "black"
                      ? "0 8px 32px rgba(0,0,0,0.45)"
                      : "0 8px 32px rgba(28,21,16,0.15)",
                }}
              >
                {photoStrip.photos.map((photo, i) => (
                  <img key={i} src={photo} alt={`Photo ${i + 1}`} />
                ))}
                <div
                  className="mt-2 text-center uppercase"
                  style={{
                    fontSize: "0.5rem",
                    color: style.textColor,
                    letterSpacing: "0.14em",
                  }}
                >
                  Pocket Booth · {photoStrip.date}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:gap-3 flex-1 items-stretch section-enter d3 pt-1">
              <button
                onClick={() =>
                  downloadPhotoStrip(
                    photoStrip.photos,
                    `photo-strip-${photoStrip.id}.jpg`,
                    photoStrip.date,
                    style.bg,
                    style.textColor,
                  )
                }
                className="btn-primary"
                style={{ padding: "0.65rem 1rem", fontSize: "0.875rem" }}
              >
                <FaDownload className="w-3.5 h-3.5" />
                Download strip
              </button>

              {showUploadButton && (
                <button
                  onClick={handleUpload}
                  disabled={uploadStatus === "uploading" || isLimitReached}
                  className="btn-secondary"
                  style={{
                    padding: "0.6rem 1rem",
                    fontSize: "0.875rem",
                    opacity:
                      uploadStatus === "uploading" || isLimitReached ? 0.5 : 1,
                    cursor:
                      uploadStatus === "uploading" || isLimitReached
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <FaCloudArrowUp
                    className={`w-3.5 h-3.5 ${uploadStatus === "uploading" ? "animate-pulse" : ""}`}
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
                className="border-t pt-2 sm:pt-3 mt-1 flex flex-col gap-2"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={retake}
                  className="btn-secondary"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.875rem" }}
                >
                  <FaRotateLeft className="w-3.5 h-3.5" />
                  Take another
                </button>
                <button
                  onClick={() => navigateTo("gallery")}
                  className="btn-ghost"
                  style={{ color: "var(--warm-muted)", fontSize: "0.875rem" }}
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
              <FaCamera className="w-8 h-8" style={{ color: "var(--border)" }} />
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
            <button onClick={() => scrollToSection(2)} className="btn-primary">
              <FaCamera className="w-4 h-4" />
              Go to camera
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
