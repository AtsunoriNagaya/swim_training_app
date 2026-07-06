// メニュー表示で共通に使う日付・負荷レベルの表示ヘルパー

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getLoadLevelLabel = (level: string) => {
  switch (level) {
    case "A":
      return "高負荷";
    case "B":
      return "中負荷";
    case "C":
      return "低負荷";
    default:
      return level;
  }
};

export const getLoadLevelColor = (level: string) => {
  switch (level) {
    case "A":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30";
    case "B":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30";
    case "C":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30";
    default:
      return "";
  }
};
