import { POST as generateMenu } from '../../app/api/generate-menu/route';
import { GenerateMenuRequest, TrainingMenu, MenuItem } from '../../types/menu';
import { NextRequest } from 'next/server';

describe('Customization and Time Adjustment Integration (IT-006)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';
  });

  test('負荷レベルと練習時間に基づいて適切なメニューが生成される', async () => {
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '高',
      trainingTime: 90,
      apiKey: 'mock_openai_key',
      specialNotes: '高強度トレーニング'
    };

    const req = new NextRequest('http://localhost:3000/api/generate-menu', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await generateMenu(req);
    expect(response).toBeDefined();

    const data = await response.json();
    expect(data).toBeDefined();

    expect(data.loadLevels[0]).toBe('高');
    expect(data.totalTime).toBeLessThanOrEqual(params.trainingTime);

    // メニュー項目の検証
    data.menu.forEach((section: any) => {
      section.items.forEach((item: MenuItem) => {
        // intensity is not a property of MenuItem
      });
    });

    // 合計時間の検証
    const totalDuration = data.menu.reduce((sum: number, section: any) => sum + section.totalTime, 0);
    expect(totalDuration).toBeLessThanOrEqual(params.trainingTime);
  });

  test('特記事項が反映されたメニューが生成される', async () => {
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      apiKey: 'mock_openai_key',
      specialNotes: '肩の怪我に配慮が必要'
    };

    const req = new NextRequest('http://localhost:3000/api/generate-menu', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await generateMenu(req);
    expect(response).toBeDefined();

    const data = await response.json();
    expect(data).toBeDefined();

    // メニュー項目が特記事項を考慮しているか検証
    const menuDescriptions = data.menu.map((section: any) => section.items.map((item: MenuItem) => item.description.toLowerCase())).flat();
    expect(
      menuDescriptions.some((desc: string) => 
        desc.includes('軽め') || 
        desc.includes('注意') || 
        desc.includes('配慮')
      )
    ).toBeTruthy();
  });

  test('時間制約内で適切にメニューが調整される', async () => {
    const shortDuration: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 30,
      apiKey: 'mock_openai_key',
      specialNotes: '短時間トレーニング'
    };

    const req = new NextRequest('http://localhost:3000/api/generate-menu', {
      method: 'POST',
      body: JSON.stringify(shortDuration),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await generateMenu(req);
    expect(response).toBeDefined();

    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.totalTime).toBeLessThanOrEqual(shortDuration.trainingTime);
    expect(data.menu.length).toBeGreaterThanOrEqual(2); // 最低限のメニュー項目数
  });

  test('強度と時間のバランスが適切に調整される', async () => {
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      apiKey: 'mock_openai_key',
      specialNotes: 'バランス調整テスト'
    };

    const req = new NextRequest('http://localhost:3000/api/generate-menu', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await generateMenu(req);
    expect(response).toBeDefined();

    const data = await response.json();
    expect(data).toBeDefined();

    // 強度の分布を確認
    const intensityCount: { [key: string]: number } = {};
    data.menu.forEach((section: any) => {
      section.items.forEach((item: MenuItem) => {
        // intensityCount[item.intensity] = (intensityCount[item.intensity] || 0) + 1;
      });
    });

    // メドレー形式のバランス検証
    expect(Object.keys(intensityCount).length).toBeGreaterThanOrEqual(2);
    // expect(intensityCount['medium']).toBeDefined();
  });
});
