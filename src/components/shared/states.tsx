"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LoadingState({ message = "Loading…", className }: { message?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-muted-foreground", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon: Icon,
  className,
}: {
  title: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
    >
      {Icon && (
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      )}
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      {message && <p className="text-sm text-muted-foreground max-w-sm">{message}</p>}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "teal",
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "teal" | "amber" | "emerald" | "cyan";
  index?: number;
}) {
  const gradients: Record<string, string> = {
    teal: "from-teal-500 to-emerald-500",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-green-500",
    cyan: "from-cyan-500 to-teal-500",
  };
  const glow: Record<string, string> = {
    teal: "shadow-teal-glow",
    amber: "shadow-amber-glow",
    emerald: "shadow-emerald-glow",
    cyan: "shadow-cyan-glow",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4) }}
      whileHover={{ y: -3 }}
      className="stat-card-premium card-3d card-inner-glow p-4 sm:p-5"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            "h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
            gradients[variant],
            glow[variant]
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </motion.div>
  );
}
