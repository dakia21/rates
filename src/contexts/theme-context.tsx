"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "midnight" | "light" | "emerald" | "sakura" | "cyberpunk" | "nordic";

const THEMES: Theme[] = ["midnight", "light", "emerald", "sakura", "cyberpunk", "nordic"];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let stored = localStorage.getItem("rates-theme") as Theme | "dark" | null;
    if (stored === "dark") stored = "midnight";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = (stored as Theme) || (prefersDark ? "midnight" : "light");
    
    setThemeState(initial);
    const root = document.documentElement;
    root.classList.remove("midnight", "light", "emerald", "sakura", "cyberpunk", "nordic");
    root.classList.add(initial);
    root.classList.toggle("dark", initial !== "light");

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragstart", handleDragStart);
    return () => {
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("rates-theme", newTheme);
    const root = document.documentElement;
    root.classList.remove("midnight", "light", "emerald", "sakura", "cyberpunk", "nordic");
    root.classList.add(newTheme);
    root.classList.toggle("dark", newTheme !== "light");
  };

  const toggleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "midnight", toggleTheme: () => {}, setTheme: () => {} }}>
        <div className="opacity-0">{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
