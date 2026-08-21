"use client";

import React, { useState } from "react";
import { MathRenderer } from "./MathRenderer";
import { Sigma, Copy, Check, Plus } from "lucide-react";

interface MathEquationAssistantProps {
  onInsertLatex: (latex: string) => void;
}

const MATH_PRESETS = [
  { label: "Pecahan", latex: "\\frac{a}{b}" },
  { label: "Pangkat", latex: "x^{n}" },
  { label: "Akar Kuadrat", latex: "\\sqrt{x}" },
  { label: "Akar n", latex: "\\sqrt[n]{x}" },
  { label: "Penjumlahan", latex: "\\sum_{i=1}^{n} x_i" },
  { label: "Integral", latex: "\\int_{a}^{b} f(x) dx" },
  { label: "Limit", latex: "\\lim_{x \\to \\infty} f(x)" },
  { label: "Matriks 2x2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { label: "Vektor", latex: "\\vec{v}" },
  { label: "Persamaan Kuadrat", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { label: "Sama Dengan", latex: "=" },
  { label: "Tidak Sama Dengan", latex: "\\neq" },
  { label: "Kurang dari sama", latex: "\\leq" },
  { label: "Lebih dari sama", latex: "\\geq" },
  { label: "Plus Minus", latex: "\\pm" },
  { label: "Kali", latex: "\\times" },
  { label: "Bagi", latex: "\\div" },
  { label: "Pi", latex: "\\pi" },
  { label: "Theta", latex: "\\theta" },
  { label: "Alpha", latex: "\\alpha" },
  { label: "Beta", latex: "\\beta" },
  { label: "Infinity", latex: "\\infty" },
];

export function MathEquationAssistant({ onInsertLatex }: MathEquationAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMath, setCustomMath] = useState("");
  const [copied, setCopied] = useState(false);

  const handleInsert = (latexSnippet: string, isBlock: boolean = false) => {
    const formatted = isBlock ? `$$${latexSnippet}$$` : `$${latexSnippet}$`;
    onInsertLatex(formatted);
  };

  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
          <Sigma size={20} />
          <span>Menu Asisten Persamaan Matematika (LaTeX)</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white px-3 py-1.5 rounded-lg font-semibold transition"
        >
          {isOpen ? "Sembunyikan Menu" : "Buka Menu Persamaan"}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-2 border-t border-[var(--border)] animate-fade-in">
          {/* Presets Grid */}
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--muted-foreground)] mb-2">
              Simbol & Rumus Siap Pakai
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {MATH_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleInsert(preset.latex)}
                  className="flex flex-col items-center justify-center p-2.5 bg-[var(--background)] hover:border-[var(--primary)] border border-[var(--border)] rounded-xl transition text-center group"
                >
                  <span className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--primary)] font-medium mb-1">
                    {preset.label}
                  </span>
                  <div className="text-sm font-bold text-[var(--foreground)] pointer-events-none">
                    <MathRenderer text={`$${preset.latex}$`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Equation Tester & Inserter */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="block text-xs font-bold uppercase text-[var(--muted-foreground)]">
              Tulis Rumus Kustom (Live Preview)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customMath}
                onChange={(e) => setCustomMath(e.target.value)}
                placeholder="Contoh: \sqrt{a^2 + b^2}"
                className="flex-1 p-2 text-xs border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono"
              />
              <button
                type="button"
                disabled={!customMath.trim()}
                onClick={() => handleInsert(customMath, false)}
                className="flex items-center gap-1 bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition"
              >
                <Plus size={14} /> Sisip Inline
              </button>
              <button
                type="button"
                disabled={!customMath.trim()}
                onClick={() => handleInsert(customMath, true)}
                className="flex items-center gap-1 bg-[var(--secondary)] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition"
              >
                <Plus size={14} /> Sisip Block
              </button>
            </div>

            {/* Live Preview Box */}
            {customMath.trim() && (
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center">
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold block mb-1">
                  Preview Hasil Rumus:
                </span>
                <MathRenderer text={`$$${customMath}$$`} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
