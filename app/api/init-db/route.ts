import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/neon-db";

async function handleInitDatabase() {
  try {
    console.log("[API] 🔧 Initializing database");
    
    await initDatabase();
    
    console.log("[API] ✅ Database initialization completed successfully");
    
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully"
    });
  } catch (error: any) {
    console.error("[API] 🚨 Database initialization error:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({
      error: "Failed to initialize database",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST() {
  return handleInitDatabase();
}

export async function GET() {
  return handleInitDatabase();
}
