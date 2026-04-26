/**
 * Markdown Content Renderer - Phase 1
 * Melakukan rendering konten chat yang mengandung markdown sederhana.
 * Diimplementasikan secara minimal: bold, italic, inline code, dan code block.
 * Untuk library lengkap (react-markdown) akan ditambahkan di Phase 2.
 */

import React from "react";

export interface MarkdownContentRendererProps {
  content: string;
}

export const MarkdownContentRenderer: React.FC<MarkdownContentRendererProps> = ({
  content,
}) => {
  // Escape terlebih dahulu, lalu parse
  const segments = parseSimpleMarkdown(content);

  return (
    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {segments.map((seg, i) => {
        if (seg.type === "bold") {
          return <strong key={i}>{seg.text}</strong>;
        }
        if (seg.type === "italic") {
          return <em key={i}>{seg.text}</em>;
        }
        if (seg.type === "code") {
          return (
            <code
              key={i}
              style={{
                backgroundColor: "#334155",
                padding: "1px 5px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            >
              {seg.text}
            </code>
          );
        }
        return <React.Fragment key={i}>{seg.text}</React.Fragment>;
      })}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Simple Markdown Parser (Phase 1)
// ---------------------------------------------------------------------------

type MarkdownSegment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string };

const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const ITALIC_REGEX = /\*(.*?)\*/g;
const CODE_REGEX = /`(.*?)`/g;

function parseSimpleMarkdown(text: string): MarkdownSegment[] {
  // Gabungkan semua pola
  const combinedRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(combinedRegex);
  const result: MarkdownSegment[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (BOLD_REGEX.test(part)) {
      result.push({ type: "bold", text: part.slice(2, -2) });
    } else if (ITALIC_REGEX.test(part)) {
      result.push({ type: "italic", text: part.slice(1, -1) });
    } else if (CODE_REGEX.test(part)) {
      result.push({ type: "code", text: part.slice(1, -1) });
    } else {
      result.push({ type: "text", text: part });
    }
  }

  return result;
}
