"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { useIPQueryStore } from "@/lib/store";
import IPQueryForm from "@/components/ip-query-form";
import IPInfoCard from "@/components/ip-info-card";
import VersionSwitcher from "@/components/version-switcher";
import ThemeToggle from "@/components/theme-toggle";
import LocationBackground from "@/components/location-background";

export default function Home() {
  const { 
    ipData, 
    isLoading, 
    executeQuery
  } = useIPQueryStore();

  // 页面加载时自动检测客户端IP
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return (
    <div className="relative isolate min-h-screen bg-gradient-main transition-colors duration-300">
      {/* Aurora light field that the glass refracts */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="aurora-orb orb-sky" />
        <div className="aurora-orb orb-violet" />
        <div className="aurora-orb orb-mint" />
        <div className="aurora-orb orb-rose" />
      </div>
      <LocationBackground />

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 顶部导航区域 */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4"
        >
          <div className="flex-1"></div>
          <VersionSwitcher />
          <div className="flex-1 flex justify-end">
            <ThemeToggle />
          </div>
        </motion.header>

        {/* 主内容区域 - 垂直居中 */}
        <div className="flex-1 flex flex-col justify-center py-8">
          {/* 查询表单 */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="px-4 md:px-6 mb-6 md:mb-8"
          >
            <IPQueryForm />
          </motion.section>

          {/* 加载状态 */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  className="w-16 h-16 liquid-glass tint-sky rounded-3xl flex items-center justify-center mb-4"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </motion.div>
                <p className="text-[rgb(var(--color-text-secondary))]">
                  Looking up IP address...
                </p>
              </motion.div>
            )}

            {/* IP信息展示 - 移除错误状态显示，只使用toast提示 */}
            {ipData && !isLoading && (
              <motion.section
                key="ip-data"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="px-4 md:px-6 w-full"
              >
                <IPInfoCard ipData={ipData} />
              </motion.section>
            )}

            {/* 占位内容（当没有数据且不在加载时） */}
            {!ipData && !isLoading && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                  className="w-20 h-20 liquid-glass tint-violet rounded-3xl flex items-center justify-center mb-6"
                >
                  <Search className="w-10 h-10 text-[rgb(var(--color-text-muted))]" />
                </motion.div>
                <p className="text-[rgb(var(--color-text-secondary))] text-center max-w-md">
                  Enter an IP address, or leave blank to look up your public IP.
                </p>
              </motion.div>
            )}
          </AnimatePresence>


        </div>

        {/* 页脚 */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center pt-6 pb-20 px-6 mt-auto"
        >
          <div className="text-xs text-[rgb(var(--color-text-muted))]">
            <p>IPInfo — IP geolocation and network information</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
