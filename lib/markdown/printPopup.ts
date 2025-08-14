// Open a new window, render Markdown → HTML, and trigger Chrome print dialog
"use client";

import mdToHtml from "@/lib/markdown/miniMarkdown";

export function openPrintPopup(markdown: string, { title = "印刷プレビュー" } = {}) {
  if (typeof window === 'undefined') return;
  const htmlContent = mdToHtml(markdown);
  const w = window.open('', '_blank');
  if (!w) return;
  const doc = w.document;
  const page = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    html, body { height: 100%; }
    body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; font-size: 12pt; color: #111; }
    .content { max-width: 180mm; margin: 0 auto; }
    h1, h2, h3 { margin: 12px 0 8px; }
    p { margin: 6px 0; line-height: 1.5; }
    code { background: #f4f4f4; padding: 0 4px; border-radius: 3px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 10px 0; }
    th, td { border: 1px solid #ccc; padding: 6px; vertical-align: middle; word-break: break-word; overflow-wrap: anywhere; }
    th { background: #f7f7f7; font-weight: 600; }
    .toolbar { display: none; }
    @media print { .no-print { display: none !important; } }
  </style>
  <script>
    window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 200); });
  </script>
</head>
<body>
  <article class="content">${htmlContent}</article>
</body>
</html>`;
  doc.open();
  doc.write(page);
  doc.close();
  try { w.focus(); } catch {}
}

export default openPrintPopup;

