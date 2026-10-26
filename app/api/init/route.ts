import { NextResponse } from "next/server";
import { startupCheckService } from "@/lib/geoip/startup-check";

// GET请求：检查初始化状态
export async function GET() {
  try {
    const status = startupCheckService.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        isReady: status.isReady,
        isChecking: status.isChecking,
        isDownloading: status.isDownloading,
        databases: status.databases,
        error: status.error,
      },
    });
  } catch (error) {
    console.error("获取初始化状态失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST请求：执行数据库初始化
export async function POST() {
  try {
    // 检查是否已经初始化
    if (startupCheckService.isInitialized()) {
      return NextResponse.json({
        success: true,
        message: "Database is already initialized",
        data: {
          isReady: true,
          databases: startupCheckService.getDatabaseStatus(),
        },
      });
    }

    // 执行数据库初始化
    await startupCheckService.performStartupCheck();

    const status = startupCheckService.getStatus();

    return NextResponse.json({
      success: true,
      message: "Database initialization complete",
      data: {
        isReady: status.isReady,
        databases: status.databases,
        error: status.error,
      },
    });
  } catch (error) {
    console.error("数据库初始化失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
