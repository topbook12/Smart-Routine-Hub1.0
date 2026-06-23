"use client";

import { motion } from "framer-motion";
import { LayoutGrid, List, CalendarRange, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "cards" | "list" | "grid" | "timeline";

const MODES: { key: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { key: "cards", label: "Cards", Icon: LayoutGrid },
  { key: "list", label: "List", Icon: List },
  { key: "grid", label: "Grid", Icon: CalendarRange },
  { key: "timeline", label: "Timeline", Icon: GitBranch },
];

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  modes?: ViewMode[];
}

export function ViewModeToggle({ value, onChange, modes = ["cards", "list", "grid"] }: Props) {
  const visible = MODES.filter((m) => modes.includes(m.key));
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
      {visible.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`viewmode-${modes.join("")}`}
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-glow"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
