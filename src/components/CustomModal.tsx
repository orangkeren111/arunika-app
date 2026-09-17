"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, HelpCircle, X } from "lucide-react";

export type ModalType = "info" | "warning" | "error" | "success" | "confirm";

export interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface CustomModalContextType {
  showAlert: (message: string, title?: string, type?: ModalType) => Promise<void>;
  showConfirm: (message: string, options?: Omit<ModalOptions, "message">) => Promise<boolean>;
}

const CustomModalContext = createContext<CustomModalContextType | null>(null);

export function CustomModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ModalOptions;
    resolve: (value: any) => void;
  } | null>(null);

  const showAlert = (message: string, title: string = "Pemberitahuan", type: ModalType = "info"): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options: { title, message, type },
        resolve: () => {
          setModalState(null);
          resolve();
        },
      });
    });
  };

  const showConfirm = (message: string, options: Omit<ModalOptions, "message"> = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          title: options.title || "Konfirmasi Tindakan",
          message,
          type: options.type || "confirm",
          confirmText: options.confirmText || "Ya, Lanjutkan",
          cancelText: options.cancelText || "Batal",
          isDanger: options.isDanger ?? false,
        },
        resolve: (result: boolean) => {
          setModalState(null);
          resolve(result);
        },
      });
    });
  };

  const handleClose = (result: boolean) => {
    if (modalState) {
      modalState.resolve(result);
    }
  };

  const renderIcon = (type?: ModalType, isDanger?: boolean) => {
    if (isDanger || type === "error") {
      return (
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
          <XCircle size={30} />
        </div>
      );
    }
    switch (type) {
      case "warning":
        return (
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle size={30} />
          </div>
        );
      case "success":
        return (
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={30} />
          </div>
        );
      case "confirm":
        return (
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <HelpCircle size={30} />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Info size={30} />
          </div>
        );
    }
  };

  return (
    <CustomModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* CENTERED APP THEMED MODAL */}
      {modalState?.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--card)] text-[var(--card-foreground)] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[var(--border)] space-y-5 relative transform transition-all scale-100 animate-in fade-in zoom-in-95">
            <button
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1.5 rounded-full hover:bg-[var(--muted)] transition"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              {renderIcon(modalState.options.type, modalState.options.isDanger)}
              <h3 className="text-xl font-bold text-[var(--foreground)] leading-snug">
                {modalState.options.title || "Pemberitahuan"}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                {modalState.options.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {modalState.options.type === "confirm" ? (
                <>
                  <button
                    onClick={() => handleClose(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-[var(--border)] text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--muted)] font-bold text-sm transition"
                  >
                    {modalState.options.cancelText || "Batal"}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow transition ${
                      modalState.options.isDanger
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-[var(--primary)] hover:opacity-90"
                    }`}
                  >
                    {modalState.options.confirmText || "Ya, Lanjutkan"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClose(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm shadow hover:opacity-90 transition"
                >
                  OK, Mengerti
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomModalContext.Provider>
  );
}

export function useCustomModal() {
  const context = useContext(CustomModalContext);
  if (!context) {
    throw new Error("useCustomModal must be used within a CustomModalProvider");
  }
  return context;
}
