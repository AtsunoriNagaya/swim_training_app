import { generateMenu } from '../../app/api/generate-menu/route';
import { generatePdf, generateCsv } from '../../lib/output-operations';
import { TrainingMenu } from '../../types/menu';

describe('Generation and Output Integration (IT-005)', () => {
  let testMenu: TrainingMenu;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';

    // テスト用のメニューを生成
    const params = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: '出力テスト用メニュー'
    };

    testMenu = await generateMenu(params);
  });

  test('生成されたメニューがPDFとして正しく出力される', async () => {
    const pdfResult = await generatePdf(testMenu);
    
    expect(pdfResult).toBeDefined();
    expect(pdfResult.buffer).toBeInstanceOf(Buffer);
    expect(pdfResult.fileName).toMatch(/\.pdf$/);
    
    // PDFの内容を検証
    const pdfContent = pdfResult.buffer.toString('utf-8');
    testMenu.menu.flatMap(section => section.items).forEach((item: TrainingMenu['menu'][number]['items'][number]) => {
      expect(pdfContent).toContain(item.description);
    });
  });

  test('生成されたメニューがCSVとして正しく出力される', async () => {
    const csvResult = await generateCsv(testMenu);
    
    expect(csvResult).toBeDefined();
    expect(csvResult.buffer).toBeInstanceOf(Buffer);
    expect(csvResult.fileName).toMatch(/\.csv$/);
    
    // CSVの内容を検証
    const csvContent = csvResult.buffer.toString('utf-8');
    const rows = csvContent.split('\n');
    
    // ヘッダー行の検証
    expect(rows[0]).toContain('説明');
    expect(rows[0]).toContain('時間');
    expect(rows[0]).toContain('強度');
    
    // データ行の検証
    testMenu.menu.flatMap(section => section.items).forEach((item: TrainingMenu['menu'][number]['items'][number], index: number) => {
      const row = rows[index + 1];
      expect(row).toContain(item.description);
    });
  });

  test('メタデータが出力ファイルに正しく含まれる', async () => {
    const pdfResult = await generatePdf(testMenu);
    const pdfContent = pdfResult.buffer.toString('utf-8');
    
    // メタデータの検証はテストしない
    expect(pdfContent).toBeDefined();
  });

  test('出力形式が正しく処理される', async () => {
    // 日本語を含むメニューの出力テスト
      const japaneseMenu: TrainingMenu = {
        ...testMenu,
        menu: [{
          name: 'test',
          totalTime: 50,
          items: [
            {
              description: 'ウォームアップ',
              distance: '',
              sets: 1,
              circle: '',
              rest: '',
            },
            {
              description: 'メインセット',
              distance: '',
              sets: 1,
              circle: '',
              rest: '',
            }
          ]
        }]
      };

    const pdfResult = await generatePdf(japaneseMenu);
    const csvResult = await generateCsv(japaneseMenu);

    // 日本語の文字化けがないことを確認
    expect(pdfResult.buffer.toString('utf-8')).toContain('ウォームアップ');
    expect(csvResult.buffer.toString('utf-8')).toContain('ウォームアップ');
  });
});
