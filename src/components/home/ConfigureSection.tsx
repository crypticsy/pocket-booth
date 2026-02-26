import { FaChevronDown, FaCameraRotate } from "react-icons/fa6";
import {
  FilterType,
  getCSSFilter,
  getFilterName,
} from "../../utils/filters";
import {
  StripStyle,
  STRIP_STYLES,
  STRIP_STYLE_ORDER,
} from "../../types";

const PREVIEW_IMG =
  "https://img.freepik.com/premium-vector/pixel-art-characters-set-8bit-avatar-funny-faces-80s-nft-cartoon-vector-icon_250257-5371.jpg";

const FILTER_LABELS: Record<FilterType, string> = {
  normal: "Natural",
  blackAndWhite: "B & W",
  cute: "Dreamy",
  film: "Film",
};

const FILTERS: FilterType[] = ["normal", "blackAndWhite", "cute", "film"];

// ── Strip preview with style selector ────────────────────────
const StripPreview = ({
  filter,
  count,
  stripStyle,
  setStripStyle,
}: {
  filter: FilterType;
  count: number;
  stripStyle: StripStyle;
  setStripStyle: (s: StripStyle) => void;
}) => {
  const style = STRIP_STYLES[stripStyle];
  return (
    <div className="flex flex-col items-center gap-1.5 section-enter-right">
      <p
        className="text-center text-xs font-semibold uppercase"
        style={{ color: "var(--warm-muted)", letterSpacing: "0.12em" }}
      >
        Preview
      </p>

      {/* Style swatches — fixed-size dots, no changing text, no layout shift */}
      <div className="flex items-center justify-center gap-2 h-5">
        {STRIP_STYLE_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStripStyle(s)}
            aria-label={STRIP_STYLES[s].label}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              flexShrink: 0,
              background: STRIP_STYLES[s].bg,
              border: `1.5px solid ${s === stripStyle ? "var(--accent)" : "var(--border)"}`,
              boxShadow:
                s === stripStyle
                  ? "0 0 0 1.5px white, 0 0 0 3px var(--accent)"
                  : "none",
              transition: "box-shadow 0.2s, border-color 0.2s",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Strip — background changes, nothing else */}
      <div
        className="photo-strip"
        style={{
          width: "100%",
          background: style.bg,
          boxShadow:
            stripStyle === "black"
              ? "0 8px 32px rgba(0,0,0,0.45)"
              : "0 8px 32px rgba(28,21,16,0.15)",
        }}
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
          className="mt-2 text-center uppercase"
          style={{
            fontSize: "0.5rem",
            color: style.textColor,
            letterSpacing: "0.12em",
          }}
        >
          Pocket Booth
        </div>
      </div>
    </div>
  );
};

type ConfigureSectionProps = {
  selectedFilter: FilterType;
  setSelectedFilter: (f: FilterType) => void;
  photoCount: number;
  setPhotoCount: (n: number) => void;
  cameraFacing: string;
  setCameraFacing: (f: string | ((prev: string) => string)) => void;
  stripStyle: StripStyle;
  setStripStyle: (s: StripStyle) => void;
  isMobile: boolean;
  isKeyBased: boolean;
  photosRemaining: number | undefined;
  scrollToSection: (index: number) => void;
};

export const ConfigureSection = ({
  selectedFilter,
  setSelectedFilter,
  photoCount,
  setPhotoCount,
  cameraFacing,
  setCameraFacing,
  stripStyle,
  setStripStyle,
  isMobile,
  isKeyBased,
  photosRemaining,
  scrollToSection,
}: ConfigureSectionProps) => {
  return (
    <section
      className="booth-section configure-section"
      style={{ background: "var(--cream)" }}
    >
      <div className="h-full flex justify-center overflow-hidden">
        <div
          className="w-full flex flex-row px-4 sm:px-6 py-5 sm:py-10 gap-4 sm:gap-8"
          style={{ maxWidth: 640 }}
        >
          {/* ── Controls column ── */}
          <div className="flex-1 flex flex-col min-w-0 mr-5">
            {/* Heading */}
            <div className="mb-4 sm:mb-6">
              <p
                className="text-xs uppercase font-semibold mb-1.5 section-enter d1"
                style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
              >
                Step 01
              </p>
              <h2
                className="font-display leading-tight section-enter d2"
                style={{
                  fontSize: "clamp(1.5rem, 5vw, 2.75rem)",
                  color: "var(--warm-text)",
                }}
              >
                Set the scene.
              </h2>
              <div className="accent-line mt-2.5 section-enter d2" />
            </div>

            {/* Filter selector — grid of buttons only, no arrows */}
            <div className="mb-4 sm:mb-8 section-enter d3">
              <p
                className="text-xs sm:text-sm font-semibold mb-2"
                style={{ color: "var(--warm-muted)" }}
              >
                Choose a filter
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FILTERS.map((f) => (
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
                        fontSize: "0.5rem",
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
            </div>

            {/* Strip length */}
            <div className="mb-4 sm:mb-8 section-enter d4">
              <p
                className="text-xs sm:text-sm font-semibold mb-2"
                style={{ color: "var(--warm-muted)" }}
              >
                Strip length
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPhotoCount(n)}
                    className={`count-card section-enter-scale d${n} ${photoCount === n ? "active" : ""}`}
                    style={{ minHeight: 40}}
                  >
                    <span className="font-display text-lg sm:text-xl leading-none">
                      {n}
                    </span>
                    <span
                      className="text-[9px] sm:text-[10px] font-body"
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
              <div className="mb-3 section-enter d5">
                <button
                  onClick={() =>
                    setCameraFacing((f) =>
                      f === "user" ? "environment" : "user",
                    )
                  }
                  className="btn-secondary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                >
                  <FaCameraRotate className="w-3.5 h-3.5" />
                  {cameraFacing === "user" ? "Front camera" : "Back camera"}
                </button>
              </div>
            )}

            {/* Photo limit */}
            {isKeyBased && photosRemaining !== undefined && (
              <div
                className="mb-3 px-3 py-2 rounded-xl text-xs font-medium"
                style={{
                  background:
                    photosRemaining === 0 ? "#fef2f2" : "var(--accent-light)",
                  color:
                    photosRemaining === 0 ? "#b91c1c" : "var(--accent-dark)",
                  border: `1px solid ${photosRemaining === 0 ? "#fecaca" : "var(--border)"}`,
                }}
              >
                {photosRemaining === 0
                  ? "Upload limit reached."
                  : `${photosRemaining} upload${photosRemaining !== 1 ? "s" : ""} remaining.`}
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pt-2 flex flex-col gap-2">
              <span className="text-xs" style={{ color: "var(--warm-muted)" }}>
                {getFilterName(selectedFilter)} · {photoCount} photo
                {photoCount !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => scrollToSection(2)}
                className="btn-primary"
                style={{ padding: "0.65rem 1.25rem", fontSize: "0.875rem" }}
              >
                Ready to shoot
                <FaChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* ── Strip preview column — fixed width so style changes don't reflow controls ── */}
          <div
            className="flex-shrink-0 flex flex-col items-center pt-1 sm:pt-6"
            style={{ width: "7.5rem" }}
          >
            <StripPreview
              filter={selectedFilter}
              count={photoCount}
              stripStyle={stripStyle}
              setStripStyle={setStripStyle}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
