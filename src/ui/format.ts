const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatInt = (n: number): string => integer.format(Math.round(n));
export const formatDecimal = (n: number): string => oneDecimal.format(n);
export const formatPercent = (fraction: number, digits = 1): string => `${(fraction * 100).toFixed(digits)}%`;

/** Signed difference for "+74 cushion" / "−12 short" phrasing. */
export function formatSigned(n: number): string {
  return `${n >= 0 ? '+' : '−'}${formatInt(Math.abs(n))}`;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Query a required element; failing loudly beats a silent blank region. */
export function requireElement<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}
