"use client";

import { useEffect } from "react";

/**
 * 数据库初始化组件
 * 在应用启动时静默调用初始化API
 */
export default function DatabaseInitializer() {
  useEffect(() => {
    // 静默初始化数据库
    const initializeDatabase = async () => {
      try {
        // 检查是否已经初始化
        const statusResponse = await fetch("/api/init", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          // 如果已经就绪，不需要初始化
          if (statusData.success && statusData.data.isReady) {
            console.log("数据库已就绪");
            return;
          }
        }

        // 执行初始化
        const initResponse = await fetch("/api/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (initResponse.ok) {
          const initData = await initResponse.json();
          if (initData.success) {
            console.log("数据库初始化完成");
          } else {
            console.warn("数据库初始化失败:", initData.error);
          }
        } else {
          console.warn("数据库初始化Request failed");
        }
      } catch (error) {
        // 静默处理错误，不影响应用运行
        console.warn("数据库初始化出错:", error);
      }
    };

    // 延迟执行，避免阻塞页面加载
    const timer = setTimeout(initializeDatabase, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 这个组件不渲染任何内容
  return null;
} 