import { NextResponse } from "next/server";
import { getMenu } from "@/lib/kv-storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("id");

    if (!menuId) {
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 });
    }

    const menuData = await getMenu(menuId);
    
    if (!menuData) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json(menuData);
  } catch (error: any) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
