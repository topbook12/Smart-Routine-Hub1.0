"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // next-themes requires a mounted gate to avoid hydration mismatch.
  // This is the canonical pattern documented by next-themes. The lint rule
  // react-hooks/set-state-in-effect is a false positive here: the effect has
  // an empty dependency array and runs once on mount purely to flip a flag,
  // it does not cascade.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (theme === "system" ? resolvedTheme : theme) : "light";
  const isDark = current === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-colors",
        "bg-accent/80 hover:bg-accent text-foreground/80 hover:text-foreground",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
