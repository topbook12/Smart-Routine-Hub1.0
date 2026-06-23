"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/utils";

/* ============ Section header ============ */
export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-teal-glow shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gradient-primary leading-tight">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action}
    </motion.div>
  );
}

/* ============ Add button ============ */
export function AddButton({
  onClick,
  label,
  icon: Icon = Plus,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
      <Button
        onClick={onClick}
        className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white gap-1.5 h-9 sm:h-10"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </motion.div>
  );
}

/* ============ Row actions ============ */
export function RowActions({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onEdit}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-background hover:border-teal-500/40 hover:text-teal-600 hover:bg-teal-500/5 transition-colors"
        title={editLabel}
        aria-label={editLabel}
      >
        <Pencil className="h-3.5 w-3.5" />
      </motion.button>
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onDelete}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-background hover:border-red-500/40 hover:text-red-600 hover:bg-red-500/5 transition-colors"
        title={deleteLabel}
        aria-label={deleteLabel}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </motion.button>
    </div>
  );
}

/* ============ Confirm delete dialog ============ */
export function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm deletion",
  description = "This action cannot be undone. The item will be permanently removed.",
  confirmLabel = "Delete",
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="h-4 w-4" />
            </span>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ============ Mutation submit button ============ */
export function SubmitButton({
  loading,
  children,
  className,
  variant = "primary",
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "amber" | "destructive";
}) {
  const palette =
    variant === "amber"
      ? "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-glow"
      : variant === "destructive"
        ? "from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
        : "from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-glow";
  return (
    <Button
      type="submit"
      disabled={loading}
      className={cn("btn-3d bg-gradient-to-r text-white gap-1.5", palette, className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

/* ============ Section body shell ============ */
export function SectionShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {children}
    </motion.div>
  );
}

export { LoadingState, EmptyState };

/* ============ Back to site link ============ */
export function BackToSiteLink() {
  return (
    <Link
      href="/?view=home"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to public site
    </Link>
  );
}

/* ============ Form field wrapper ============ */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-foreground flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ============ Type badge ============ */
export function TypeBadge({ type }: { type: "theory" | "lab" }) {
  return type === "lab" ? (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
      Lab
    </span>
  ) : (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
      Theory
    </span>
  );
}

/* ============ Empty results row ============ */
export function EmptyRow({
  colSpan,
  message = "No records found.",
  icon,
}: {
  colSpan: number;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-10">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {icon && <icon className="h-7 w-7 text-muted-foreground/60" />}
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
}
