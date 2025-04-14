import { uploadFile } from '../../lib/blob-storage';
import { processForRAG } from '../../lib/embedding';
import { generateMenu } from '../../app/api/generate-menu/route';
import { MenuGenerationParams } from '../../types/menu';

describe('Upload and RAG Integration (IT-002)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('アップロードしたファイルを使用してRAGでメニューが生成される', async () => {
    // テスト用のPDFファイルデータ
    const testPdfBuffer = Buffer.from('test pdf content');
    const fileName = 'test-menu.pdf';

    // ファイルアップロード
    const uploadResult = await uploadFile({
      fileName,
      fileContent: testPdfBuffer,
      contentType: 'application/pdf'
    });
    expect(uploadResult).toBeDefined();
    expect(uploadResult.url).toBeTruthy();

    // アップロードしたファイルのRAG処理
    const ragResult = await processForRAG(uploadResult.url);
    expect(ragResult).toBeDefined();
    expect(ragResult.vectors).toBeInstanceOf(Array);
    expect(ragResult.vectors.length).toBeGreaterThan(0);

    // RAGを使用したメニュー生成
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: 'RAGテスト',
      ragEnabled: true,
      ragContext: ragResult.vectors
    };

    const generatedMenu = await generateMenu(params);
    expect(generatedMenu).toBeDefined();
    expect(generatedMenu.items).toBeInstanceOf(Array);
    expect(generatedMenu.metadata.ragEnabled).toBe(true);
    expect(generatedMenu.metadata.sourceDocuments).toContain(fileName);
  });

  test('無効なファイル形式の場合、適切なエラーが返される', async () => {
    const invalidFileBuffer = Buffer.from('invalid file content');
    const fileName = 'test.txt';

    await expect(
      uploadFile({
        fileName,
        fileContent: invalidFileBuffer,
        contentType: 'text/plain'
      })
    ).rejects.toThrow('Unsupported file type');
  });

  test('RAG処理に失敗した場合、適切なエラーが返される', async () => {
    const testPdfBuffer = Buffer.from('test pdf content');
    const fileName = 'test-menu.pdf';

    const uploadResult = await uploadFile({
      fileName,
      fileContent: testPdfBuffer,
      contentType: 'application/pdf'
    });

    // RAG処理をモックしてエラーを発生させる
    jest.spyOn(require('../../lib/embedding'), 'processForRAG')
      .mockRejectedValueOnce(new Error('RAG processing failed'));

    await expect(processForRAG(uploadResult.url))
      .rejects.toThrow('RAG processing failed');
  });

  test('RAGが無効な場合、通常のメニュー生成が行われる', async () => {
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: 'RAG無効テスト',
      ragEnabled: false
    };

    const generatedMenu = await generateMenu(params);
    expect(generatedMenu).toBeDefined();
    expect(generatedMenu.items).toBeInstanceOf(Array);
    expect(generatedMenu.metadata.ragEnabled).toBe(false);
    expect(generatedMenu.metadata.sourceDocuments).toBeUndefined();
  });
});
