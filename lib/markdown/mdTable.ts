export type Align = 'left' | 'center' | 'right';

const sanitizeForCell = (v: unknown): string => {
  if (v == null) return '\u00A0';
  let s = String(v);
  // collapse whitespace/newlines
  s = s.replace(/\s+/g, ' ').trim();
  // escape pipes in markdown tables
  s = s.replace(/\|/g, '\\|');
  if (s === '') return '\u00A0';
  return s;
};

export function toMarkdownTable(
  headers: string[],
  rows: unknown[][],
  align?: Align[]
): string {
  const head = `| ${headers.map((h) => sanitizeForCell(h)).join(' | ')} |`;
  const sep = `| ${headers
    .map((_, i) => {
      const a = align?.[i] ?? 'left';
      if (a === 'left') return ':---';
      if (a === 'right') return '---:';
      return ':---:'; // center
    })
    .join(' | ')} |`;
  const body = rows
    .map((r) => `| ${r.map((c) => sanitizeForCell(c)).join(' | ')} |`)
    .join('\n');
  return [head, sep, body].join('\n');
}

export default toMarkdownTable;

