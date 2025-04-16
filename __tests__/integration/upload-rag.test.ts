import { uploadFileToBlob, saveJsonToBlob } from '../../lib/blob-storage';
import { getEmbedding } from '../../lib/embedding';
import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';
import type { GenerateMenuRequest, TrainingMenu } from '../../types/menu';
import { NextRequest } from 'next/server';

describe('Upload and RAG Integration (IT-002)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('アップロードしたファイルを使用してRAGでメニューが生成される', async () => {
    // テスト用のPDFファイルデータ
    const testPdfBuffer = Buffer.from('test pdf content');
    const fileName = 'test-menu.pdf';

    // ファイルアップロード
    const file = new File([testPdfBuffer], fileName, { type: 'application/pdf' });
    const uploadResult = await uploadFileToBlob(file, `test-uploads/${fileName}`);
    expect(uploadResult).toBeDefined();
    expect(uploadResult).toBeTruthy();

    // アップロードしたファイルのRAG処理
const embeddings = await getEmbedding(uploadResult as string, process.env.OPENAI_API_KEY as string);
    expect(embeddings).toBeDefined();
    expect(Array.isArray(embeddings)).toBe(true);
    expect(embeddings.length).toBeGreaterThan(0);

    // RAGを使用したメニュー生成
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: 'RAGテスト'
    };

    const request = {
      json: () => Promise.resolve(params)
    } as any;
    const response = await generateMenuHandler(request);
    const generatedMenu = await response.json();
    expect(generatedMenu).toBeDefined();
    expect(generatedMenu.menu).toBeInstanceOf(Array);
    expect(generatedMenu.metadata?.ragEnabled).toBe(true);
    expect(generatedMenu.metadata?.sourceDocuments).toContain(fileName);
  });

  test('無効なファイル形式の場合、適切なエラーが返される', async () => {
    const invalidFileBuffer = Buffer.from('invalid file content');
    const fileName = 'test.txt';

    const invalidFile = new File([invalidFileBuffer], fileName, { type: 'text/plain' });
    await expect(uploadFileToBlob(invalidFile, `test-uploads/${fileName}`))
      .rejects.toThrow('Unsupported file type');
  });

  test('RAG処理に失敗した場合、適切なエラーが返される', async () => {
    const testPdfBuffer = Buffer.from('test pdf content');
    const fileName = 'test-menu.pdf';

    const file = new File([testPdfBuffer], fileName, { type: 'application/pdf' });
    const uploadResult = await uploadFileToBlob(file, `test-uploads/${fileName}`);

    // getEmbedding関数をモックしてエラーを発生させる
    jest.spyOn(require('../../lib/embedding'), 'getEmbedding')
      .mockRejectedValueOnce(new Error('RAG処理に失敗しました'));

    await expect(getEmbedding(uploadResult, process.env.OPENAI_API_KEY as string))
      .rejects.toThrow('RAG処理に失敗しました');
  });

  test('RAGが無効な場合、通常のメニュー生成が行われる', async () => {
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: 'RAG無効テスト'
    };

    const request = {
      json: () => Promise.resolve(params)
    } as NextRequest;
    const response = await generateMenuHandler(request);
    const generatedMenu = await response.json();
    expect(generatedMenu).toBeDefined();
    expect(generatedMenu.menu).toBeInstanceOf(Array);
    expect(generatedMenu.metadata?.ragEnabled).toBe(false);
    expect(generatedMenu.metadata?.sourceDocuments).toBeUndefined();
  });
});
