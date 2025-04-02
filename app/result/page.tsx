import type { Metadata } from "next"
import TrainingMenuResult from "@/components/training-menu-result"

export const metadata: Metadata = {
  title: "生成結果 - 水泳部練習メニュー作成アプリ",
  description: "AIによって生成された水泳部の練習メニュー",
}

// Propsの型を定義
type ResultPageProps = {
  searchParams: { id: string };
};

async function getMenuData(menuId: string) {
  try {
    const response = await fetch(`/api/get-menu?id=${menuId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch menu data");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching menu data:", error);
    return null;
  }
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const menuId = searchParams.id;
  const menuData = await getMenuData(menuId);

  if (!menuData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">メニューが見つかりません</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            指定されたIDのメニューが見つかりませんでした。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">生成されたメニュー</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          AIによって生成された練習メニューです。 PDFやCSVでダウンロードすることができます。
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <TrainingMenuResult menuData={menuData} />
      </div>
    </div>
  );
}
