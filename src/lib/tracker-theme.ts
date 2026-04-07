import { ThemeColors, AxisColors } from "./tracker-types";

export const lightTheme: ThemeColors = {
  bg: "#f7f6f3", surface: "#ffffff", surfaceAlt: "#f0efe9",
  border: "#e4e2d9", borderStrong: "#ccc9be",
  text: "#1a1915", textSub: "#6b6860", textMuted: "#a8a59e",
  noteBg: "#fef9ec", noteBorder: "#f5cc6a", noteText: "#7a5a00",
  shadow: "0 1px 4px rgba(0,0,0,0.07)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.09)"
};

export const darkTheme: ThemeColors = {
  bg: "#141412", surface: "#1e1d1a", surfaceAlt: "#252420",
  border: "#2e2c27", borderStrong: "#3d3b34",
  text: "#f0ede6", textSub: "#9e9a91", textMuted: "#5c5950",
  noteBg: "#2a240e", noteBorder: "#7a5a00", noteText: "#f5cc6a",
  shadow: "0 1px 4px rgba(0,0,0,0.3)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.4)"
};

export const epanouissementLight: AxisColors = {
  accent: "#00c48c",
  accentLight: "#e6faf4",
  accentText: "#005540",
  subGradient: "linear-gradient(135deg, #00c48c, #00e6a8)",
  subText: "#003d2e",
  subCountBg: "rgba(0,60,46,0.15)",
  subCountText: "#003d2e",
  groupGradient: "linear-gradient(90deg, #e6faf4, #f0fdf8)",
  groupBorder: "#a0e8cf",
  groupText: "#005540"
};

export const epanouissementDark: AxisColors = {
  accent: "#00c48c",
  accentLight: "#0a2620",
  accentText: "#00c48c",
  subGradient: "linear-gradient(135deg, #005540, #007a60)",
  subText: "#00c48c",
  subCountBg: "rgba(0,196,140,0.12)",
  subCountText: "#00c48c",
  groupGradient: "linear-gradient(90deg, #0a2620, #0d3028)",
  groupBorder: "#1a5040",
  groupText: "#00c48c"
};

export const relaxationLight: AxisColors = {
  accent: "#8b7ff5",
  accentLight: "#f0eeff",
  accentText: "#3a2e9b",
  subGradient: "linear-gradient(135deg, #8b7ff5, #a89ef8)",
  subText: "#1e1660",
  subCountBg: "rgba(30,22,96,0.12)",
  subCountText: "#1e1660",
  groupGradient: "linear-gradient(90deg, #f0eeff, #f5f3ff)",
  groupBorder: "#c4befa",
  groupText: "#3a2e9b"
};

export const relaxationDark: AxisColors = {
  accent: "#8b7ff5",
  accentLight: "#14102a",
  accentText: "#8b7ff5",
  subGradient: "linear-gradient(135deg, #3a2e9b, #4f42b8)",
  subText: "#c4befa",
  subCountBg: "rgba(139,127,245,0.15)",
  subCountText: "#8b7ff5",
  groupGradient: "linear-gradient(90deg, #14102a, #1a1535)",
  groupBorder: "#3a2e9b",
  groupText: "#8b7ff5"
};

export function getAxisColors(tabIndex: number, isDark: boolean): AxisColors {
  if (tabIndex <= 1) return isDark ? epanouissementDark : epanouissementLight;
  return isDark ? relaxationDark : relaxationLight;
}

export const macroStatuses = {
  none: { label: "-", icon: "\u25CB" },
  outdated: { label: "Outdated", icon: "\u25C8" },
  kill: { label: "Kill", icon: "\u2715" },
  horsmvp: { label: "Hors MVP v1", icon: "\u25F7" }
};

export const microStatuses = {
  none: { label: "None", icon: "\u00B7" },
  doing: { label: "Doing", icon: "\u25B7" },
  done: { label: "Done", icon: "\u2713" }
};

export function getMacroBadgeColors(status: string, isDark: boolean) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    none: isDark
      ? { bg: "#252420", border: "#3d3b34", text: "#9e9a91" }
      : { bg: "#f0efe9", border: "#d4d1c5", text: "#6b6860" },
    outdated: isDark
      ? { bg: "#494846", border: "#5c5950", text: "#c8c5bc" }
      : { bg: "#e8e7e2", border: "#a8a59e", text: "#4a4840" },
    kill: isDark
      ? { bg: "#3d1818", border: "#7a2020", text: "#f4a0a0" }
      : { bg: "#fde8e8", border: "#f4a0a0", text: "#9b2020" },
    horsmvp: isDark
      ? { bg: "#332606", border: "#7a5a00", text: "#f5cc6a" }
      : { bg: "#fef3dc", border: "#f5cc6a", text: "#7a5a00" }
  };
  return map[status] || map.none;
}

export function getMicroBadgeColors(status: string, isDark: boolean) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    none: isDark
      ? { bg: "#252420", border: "#3d3b34", text: "#9e9a91" }
      : { bg: "#f0efe9", border: "#d4d1c5", text: "#6b6860" },
    doing: isDark
      ? { bg: "#0d1e33", border: "#1a4a80", text: "#80b8f0" }
      : { bg: "#ddeeff", border: "#80b8f0", text: "#1a4a80" },
    done: isDark
      ? { bg: "#0d2a1a", border: "#1a6640", text: "#70d49a" }
      : { bg: "#ddf5e8", border: "#70d49a", text: "#1a6640" }
  };
  return map[status] || map.none;
}

export const TAG_PALETTE = [
  "#00c48c","#8b7ff5","#f5a623","#e24b4a","#4a9eff",
  "#e91e8c","#00bcd4","#8bc34a","#ff7043","#9c27b0"
];
