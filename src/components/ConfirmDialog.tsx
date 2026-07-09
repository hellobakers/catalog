"use client";

import { AlertTriangle, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border bg-card p-8 shadow-2xl shadow-destructive/10"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-foreground mb-3">
                {title}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-muted-foreground mb-8">
                {message}
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl bg-secondary px-6 py-4 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80 disabled:opacity-50"
                >
                  Keep It
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl bg-destructive px-6 py-4 text-sm font-bold text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing</span>
                    </div>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
