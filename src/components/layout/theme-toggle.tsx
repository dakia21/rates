"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { motion } from "framer-motion";
import { soundEffects } from "@/lib/utils/sounds";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => {
        toggleTheme();
        soundEffects.playClick();
      }}
      className="relative p-2.5 rounded-xl glass hover:bg-secondary/50 transition-all duration-300"
      aria-label="Переключить тему"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme !== "light" ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme !== "light" ? (
          <Moon className="w-5 h-5 text-rates-400" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
}
