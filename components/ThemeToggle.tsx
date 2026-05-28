"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      className="flex items-center w-11 h-6 rounded-full cursor-pointer shrink-0 transition-colors"
      style={{
        background: isDark ? "#4338ca" : "#e0e7ff",
        border: `1px solid ${isDark ? "#4f46e5" : "#c7d2fe"}`,
      }}
    >
      <span
        className="flex items-center justify-center w-5 h-5 rounded-full shadow transition-transform"
        style={{
          background: isDark ? "#a5b4fc" : "#4f46e5",
          transform: isDark ? "translateX(22px)" : "translateX(2px)",
        }}
      >
        {isDark
          ? <Moon size={11} className="text-indigo-900" />
          : <Sun size={11} className="text-white" />
        }
      </span>
    </button>
  );
}
