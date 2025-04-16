export const saveMenu = jest.fn().mockResolvedValue(true);
export const searchSimilarMenus = jest.fn().mockResolvedValue([
  {
    menuData: {
      title: "テスト用メニュー",
      totalTime: 90,
      targetSkills: ["持久力", "スピード"]
    }
  }
]);
