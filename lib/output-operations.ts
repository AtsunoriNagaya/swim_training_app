import type { TrainingMenu } from '../types/menu';

interface OutputResult {
  buffer: Buffer;
  fileName: string;
}

export async function generatePdf(menu: TrainingMenu): Promise<OutputResult> {
  // PDFの生成処理（モック）
  const content = generateContentString(menu);
  return {
    buffer: Buffer.from(content),
    fileName: `menu-${Date.now()}.pdf`
  };
}

export async function generateCsv(menu: TrainingMenu): Promise<OutputResult> {
  const header = "セクション名,説明,距離,セット数,サークル,休憩,時間(分),強度"; // ヘッダーに強度を追加
  const rows = menu.menu.flatMap(section =>
    section.items.map(item =>
      [
        section.name,
        item.description,
        item.distance || '',
        item.sets || '',
        item.circle || '',
        item.rest || '',
        item.time || '',
        menu.intensity || '' // 強度データを追加
      ].join(',')
    )
  );
  const csvContent = [header, ...rows].join('\n');
  return {
    buffer: Buffer.from(csvContent, 'utf-8'),
    fileName: `menu-${menu.menuId || Date.now()}.csv`
  };
}

function generateContentString(menu: TrainingMenu): string {
  // PDF生成用の文字列生成（簡易版）
  let content = `タイトル: ${menu.title}\n`;
  content += `合計時間: ${menu.totalTime}分\n`;
  content += `強度: ${menu.intensity || '指定なし'}\n\n`;

  menu.menu.forEach(section => {
    content += `--- ${section.name} (${section.totalTime}分) ---\n`;
    section.items.forEach(item => {
      content += `- ${item.description}`;
      if (item.distance) content += ` (${item.distance})`;
      if (item.sets) content += ` x ${item.sets}セット`;
      if (item.circle) content += ` (${item.circle}サークル)`;
      if (item.rest) content += ` 休憩:${item.rest}`;
      content += '\n';
    });
    content += '\n';
  });
  return content;
}
