// DOM-free text measurement helpers powered by @chenglou/pretext.
// Use these in member-portal components to reserve space, decide truncation,
// and keep layouts stable on slow mobile networks (no CLS from text reflow).

import {
  prepare,
  prepareWithSegments,
  layout,
  measureLineStats,
  measureNaturalWidth,
  type PreparedText,
} from "@chenglou/pretext";

// Our default font stack. Keep this in sync with `--font-geist-sans` in layout.
// Pretext accepts a CSS-font-string (`<weight> <size>px <family>`).
export const GEIST_STACK = "Geist, system-ui, -apple-system, Helvetica, Arial, sans-serif";

export type MeasureStyle = {
  weight?: number | string;
  sizePx: number;
  lineHeightPx?: number; // defaults to 1.4 * sizePx
  family?: string;
};

function toFontString({ weight = 400, sizePx, family = GEIST_STACK }: MeasureStyle): string {
  return `${weight} ${sizePx}px ${family}`;
}

export type MeasuredBlock = {
  height: number;
  lineCount: number;
};

/**
 * Measure the rendered block size of `text` at the given style, constrained to
 * `maxWidthPx`. Returns `{ height, lineCount }`. Safe on the server (SSR):
 * pretext is pure JS and does not touch the DOM.
 */
export function measureBlock(
  text: string,
  maxWidthPx: number,
  style: MeasureStyle,
): MeasuredBlock {
  const font = toFontString(style);
  const lineHeight = style.lineHeightPx ?? Math.round(style.sizePx * 1.4);
  const prepared: PreparedText = prepare(text, font);
  const { lineCount, height } = layout(prepared, maxWidthPx, lineHeight);
  return { lineCount, height };
}

/**
 * Decide whether `text` fits on one line at the given width + style.
 * Use for hero greetings and big numbers where overflow forces a fallback.
 */
export function fitsOnOneLine(text: string, maxWidthPx: number, style: MeasureStyle): boolean {
  const font = toFontString(style);
  const prepared = prepareWithSegments(text, font);
  return measureNaturalWidth(prepared) <= maxWidthPx;
}

/**
 * Return `lineCount` and `maxLineWidth` at the given constraints. Useful for
 * deciding between "show 2 lines truncated" vs "show all" in quest cards.
 */
export function measureLines(
  text: string,
  maxWidthPx: number,
  style: MeasureStyle,
): { lineCount: number; maxLineWidth: number } {
  const font = toFontString(style);
  const prepared = prepareWithSegments(text, font);
  return measureLineStats(prepared, maxWidthPx);
}
