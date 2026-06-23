"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  badge,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  badge?: string | number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-end justify-between gap-3 mb-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          {badge !== undefined && (
            <Badge variant="outline" className="text-[10px] h-5">{badge}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}
