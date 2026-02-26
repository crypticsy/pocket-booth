export type PhotoStripType = {
  id: number;
  photos: string[];
  timestamp: string;
  date: string;
};

export type Stage =
  | "idle"
  | "loading"
  | "ready"
  | "countdown"
  | "capturing"
  | "complete";

export type StripStyle = "white" | "black";

export type StripStyleConfig = {
  bg: string;
  textColor: string;
  label: string;
};

export const STRIP_STYLES: Record<StripStyle, StripStyleConfig> = {
  white: { bg: "#ffffff", textColor: "#8b7d6e", label: "White" },
  black: { bg: "#1c1510", textColor: "#c4916c", label: "Black" },
};

export const STRIP_STYLE_ORDER: StripStyle[] = ["white", "black"];
