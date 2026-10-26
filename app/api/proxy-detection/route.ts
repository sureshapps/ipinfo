import { NextRequest, NextResponse } from "next/server";
import { detectProxy, ProxyDetectionResult } from "@/lib/ip-detection";

/**
 * Connection checkAPI路由
 * GET请求：检测当前客户端的代理使用情况
 */
export async function GET(request: NextRequest) {
  try {
    console.log("开始Connection check...");
    
    // 执行Connection check
    const result: ProxyDetectionResult = await detectProxy(request);
    
    console.log("Connection check complete:", {
      headerIP: result.headerIP,
      domesticIP: result.domesticIP,
      foreignIP: result.foreignIP,
      proxyType: result.proxyType,
      confidence: result.confidence,
      detectionTime: result.detectionTime,
      errorCount: result.errors.length,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60", // 缓存1分钟
      },
    });
  } catch (error) {
    console.error("Connection check failed:", error);
    
    // 返回错误信息，但保持API结构一致
    const errorResult: ProxyDetectionResult = {
      headerIP: null,
      domesticIP: null,
      foreignIP: null,
      isUsingProxy: false,
      proxyType: 'unknown',
      confidence: 0,
      errors: [error instanceof Error ? error.message : "Connection check failed"],
      detectionTime: 0,
    };

    return NextResponse.json(errorResult, {
      status: 500,
    });
  }
}

/**
 * POST请求：检测指定IP的代理情况（可选功能）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enableProxyDetection } = body;

    if (!enableProxyDetection) {
      return NextResponse.json(
        { error: "Connection check is disabled" },
        { status: 400 }
      );
    }

    // 执行Connection check
    const result: ProxyDetectionResult = await detectProxy(request);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("Connection checkPOSTRequest failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection check failed" },
      { status: 500 }
    );
  }
}
