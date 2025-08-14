import { NextResponse } from "next/server";
import { getMenuHistory } from "@/lib/neon-db";

export async function GET() {
  try {
    console.log("[API] 🔍 Fetching menu history");
    
    const menuHistory = await getMenuHistory();
    
    console.log(`[API] ✅ Successfully retrieved ${menuHistory.length} menus from history`);
    
    return NextResponse.json({
      success: true,
      menus: menuHistory,
      count: menuHistory.length
    });
  } catch (error: any) {
    console.error("[API] 🚨 Error fetching menu history:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({
      error: "Failed to fetch menu history",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
