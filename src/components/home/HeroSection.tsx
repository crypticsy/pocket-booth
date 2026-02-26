import { FaChevronDown, FaImage } from "react-icons/fa6";
import appIcon from "../../assets/icon.png";

type HeroSectionProps = {
  navigateTo: (route: string) => void;
  photoStripsCount: number;
  scrollToSection: (index: number) => void;
};

export const HeroSection = ({
  navigateTo,
  photoStripsCount,
  scrollToSection,
}: HeroSectionProps) => (
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
          {photoStripsCount > 0 && (
            <span
              className="text-xs font-semibold rounded-full px-1.5 py-0.5"
              style={{
                background: "var(--accent-light)",
                color: "var(--accent-dark)",
              }}
            >
              {photoStripsCount}
            </span>
          )}
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Floating film-hole dots */}
        <div className="flex gap-3 mb-8 opacity-40">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="hero-dot" style={{ width: 9, height: 9 }} />
          ))}
        </div>

        {/* Title + icon wrapper */}
        <div className="relative inline-block">
          <h1
            className="font-display section-enter d2 leading-none tracking-tight"
            style={{
              fontSize: "clamp(3rem, 12vw, 6rem)",
              color: "var(--warm-text)",
            }}
          >
            Pocket Booth
          </h1>

          {/* Wiggling camera icon */}
          <img
            src={appIcon}
            alt="Pocket Booth"
            className="absolute icon-wiggle"
            style={{
              width: "clamp(32px, 6vw, 48px)",
              height: "clamp(32px, 6vw, 48px)",
              objectFit: "contain",
              right: "-2.5rem",
              top: "0%",
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

      {/* Bottom bar: credit + scroll */}
      <div className="pb-8 flex flex-col items-center gap-3 section-enter d5">
        <p className="text-xs pb-12" style={{ color: "var(--warm-muted)" }}>
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
);
