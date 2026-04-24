import { useEffect, useState } from "react";

/**
 * Reads/writes the `dark` class on <html> and persists to localStorage.
 * Returns [isDark, toggleDark].
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    // Fall back to OS preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return [isDark, () => setIsDark((d) => !d)];
}
