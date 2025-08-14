// Minimal Markdown → HTML renderer focused on tables and basic inline styles
// Supported: headings, paragraphs, bold/italic, code, hr, and GFM-style tables

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inlineFormat = (s: string) => {
  // code spans first
  s = s.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`);
  // bold (**text**)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic (*text*)
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_m, text, href, title) => {
    const t = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(href)}"${t}>${escapeHtml(text)}</a>`;
  });
  return s;
};

const isTableSeparator = (line: string) => {
  // e.g. |:---|:---:|---:| or --- | ---
  const cells = line.trim().split('|').map((c) => c.trim());
  if (cells.length < 2) return false;
  return cells.every((c) => c === '' || /^:?-{3,}:?$/.test(c));
};

const parseAlign = (sepCell: string): 'left' | 'right' | 'center' => {
  const t = sepCell.trim();
  const left = t.startsWith(':');
  const right = t.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  return 'left';
};

const renderTable = (lines: string[], start: number) => {
  // Expect header at start, separator next, then data rows until blank/non-table
  const headerLine = lines[start];
  const sepLine = lines[start + 1];
  const headerCells = headerLine
    .replace(/^\|?|\|?$/g, '')
    .split('|')
    .map((c) => c.trim());
  const sepCells = sepLine
    .replace(/^\|?|\|?$/g, '')
    .split('|')
    .map((c) => c.trim());
  const aligns = sepCells.map(parseAlign);

  const rows: string[][] = [];
  let i = start + 2;
  for (; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.trim()) break;
    if (!ln.includes('|')) break;
    const cells = ln.replace(/^\|?|\|?$/g, '').split('|').map((c) => c.trim());
    rows.push(cells);
  }

  const thead = `<thead><tr>${headerCells
    .map((c, idx) => `<th style="text-align:${aligns[idx] || 'left'}">${inlineFormat(escapeHtml(c))}</th>`) 
    .join('')}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map((r) =>
      `<tr>${r
        .map((c, idx) => {
          const txt = c === '' ? '\u00A0' : c; // NBSP for empty
          return `<td style="text-align:${aligns[idx] || 'left'}">${inlineFormat(escapeHtml(txt))}</td>`;
        })
        .join('')}</tr>`
    )
    .join('')}</tbody>`;

  const html = `<table>${thead}${tbody}</table>`;
  return { html, next: i };
};

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    // Headings
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineFormat(escapeHtml(h[2].trim()))}</h${level}>`);
      i++;
      continue;
    }
    // HR
    if (/^---+$/.test(line.trim())) {
      out.push('<hr />');
      i++;
      continue;
    }
    // Tables (GFM)
    if (i + 1 < lines.length && lines[i].includes('|') && isTableSeparator(lines[i + 1])) {
      const { html, next } = renderTable(lines, i);
      out.push(html);
      i = next;
      continue;
    }
    // Paragraph (merge consecutive non-empty non-table lines)
    const paras: string[] = [line];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() && !(lines[j].includes('|') && isTableSeparator(lines[j + 1] || ''))) {
      paras.push(lines[j]);
      j++;
    }
    const pHtml = inlineFormat(escapeHtml(paras.join(' ')));
    out.push(`<p>${pHtml}</p>`);
    i = j;
  }

  return out.join('\n');
}

export default mdToHtml;

