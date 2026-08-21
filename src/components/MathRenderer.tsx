"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
  Renders text containing LaTeX math formulas.
  Supports:
  - Inline math: $...$ or \(...\)
  - Display/block math: $$...$$ or \[...\]
 */
export function MathRenderer({ text, className = "" }: MathRendererProps) {
  if (!text) return null;

  // Regex to match $$...$$, \[...\], $...$, or \(...\)
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\))/g;
  const parts = text.split(regex);

  return (
    <span className={`inline-wrap ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        let isBlock = false;
        let math = "";

        if (part.startsWith("$$") && part.endsWith("$$")) {
          isBlock = true;
          math = part.slice(2, -2);
        } else if (part.startsWith("\\[") && part.endsWith("\\]")) {
          isBlock = true;
          math = part.slice(2, -2);
        } else if (part.startsWith("$") && part.endsWith("$")) {
          isBlock = false;
          math = part.slice(1, -1);
        } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
          isBlock = false;
          math = part.slice(2, -2);
        } else {
          return <span key={index}>{part}</span>;
        }

        try {
          const html = katex.renderToString(math.trim(), {
            displayMode: isBlock,
            throwOnError: false,
          });

          return (
            <span
              key={index}
              className={isBlock ? "block my-2 text-center" : "inline-block px-1"}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          console.error("KaTeX render error:", err);
          return <code key={index} className="text-red-500">{part}</code>;
        }
      })}
    </span>
  );
}
