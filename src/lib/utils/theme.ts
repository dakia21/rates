export interface HslColor {
  h: number;
  s: number;
  l: number;
  str: string;
}

export function hexToHslValues(hex: string): HslColor {
  // Strip hash if present
  let cleanHex = hex.replace(/^#/, "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }

  let r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  let g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  let b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return { h, s, l, str: `${h} ${s}% ${l}%` };
}

export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function applyThemeColors(bgHex: string, primaryHex: string) {
  if (typeof window === "undefined") return;

  const bg = hexToHslValues(bgHex);
  const primary = hexToHslValues(primaryHex);

  const isLight = bg.l > 60;

  // Foreground (Text)
  const fgColor = isLight ? "240 10% 10%" : "224 10% 98%";

  // Card background
  const cardLightness = isLight ? Math.max(bg.l - 3, 0) : Math.min(bg.l + 3, 100);
  const cardColor = `${bg.h} ${bg.s}% ${cardLightness}%`;

  // Primary foreground (text on primary button)
  const primaryFgColor = primary.l > 65 ? "0 0% 0%" : "0 0% 100%";

  // Secondary
  const secondaryLightness = isLight ? Math.max(bg.l - 5, 0) : Math.min(bg.l + 5, 100);
  const secondaryColor = `${bg.h} ${bg.s}% ${secondaryLightness}%`;

  // Muted
  const mutedLightness = isLight ? Math.max(bg.l - 8, 0) : Math.min(bg.l + 8, 100);
  const mutedColor = `${bg.h} ${bg.s}% ${mutedLightness}%`;
  const mutedFgColor = isLight ? "240 4% 46%" : "224 10% 70%";

  // Border
  const borderLightness = isLight ? Math.max(bg.l - 12, 0) : Math.min(bg.l + 6, 100);
  const borderColor = `${bg.h} ${bg.s - 10 > 0 ? bg.s - 10 : bg.s}% ${borderLightness}%`;

  // Glass
  // Generate beautiful translucent variables
  const glassColor = isLight
    ? `rgba(255, 255, 255, 0.7)`
    : `rgba(${Math.round(bg.l * 2.2)}, ${Math.round(bg.l * 2.2)}, ${Math.round(bg.l * 3.2)}, 0.65)`;
  const glassBorderColor = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.06)";

  // Gradient (Accent colors)
  const gradStart = primaryHex;
  const gradEnd = hslToHex((primary.h + 30) % 360, primary.s, Math.max(primary.l - 10, 30));

  const root = document.documentElement;

  root.style.setProperty("--background", bg.str);
  root.style.setProperty("--foreground", fgColor);
  root.style.setProperty("--card", cardColor);
  root.style.setProperty("--card-foreground", fgColor);
  root.style.setProperty("--primary", primary.str);
  root.style.setProperty("--primary-foreground", primaryFgColor);
  root.style.setProperty("--secondary", secondaryColor);
  root.style.setProperty("--secondary-foreground", fgColor);
  root.style.setProperty("--muted", mutedColor);
  root.style.setProperty("--muted-foreground", mutedFgColor);
  root.style.setProperty("--accent", `${(primary.h + 20) % 360} ${primary.s}% ${primary.l}%`);
  root.style.setProperty("--accent-foreground", primaryFgColor);
  root.style.setProperty("--border", borderColor);
  root.style.setProperty("--ring", primary.str);
  root.style.setProperty("--glass", glassColor);
  root.style.setProperty("--glass-border", glassBorderColor);
  root.style.setProperty("--gradient-start", gradStart);
  root.style.setProperty("--gradient-end", gradEnd);
}
