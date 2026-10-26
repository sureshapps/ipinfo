"use client";

import React, { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Globe, Wifi, Sparkles, Target } from "lucide-react";
import { useIPQueryStore } from "@/lib/store";
import { isValidIP, checkPrivateIP } from "@/lib/ip-detection";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { toast } from "sonner";

export default function IPQueryForm() {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState("");
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);

  const { setQuery, executeQuery, isLoading, error, clearError } =
    useIPQueryStore();

  // 动态占位符文本
  const placeholders = [
    "Enter an IP address to find its location...",
    "Example: 8.8.8.8 (IPv4)",
    "Example: 2001:4860:4860::8888 (IPv6)",
    "Leave blank to look up your public IP",
    "IPv4 and IPv6 addresses supported",
    "Enter any valid public IP address",
  ];

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValidationError("");
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValue = inputValue.trim();

    // 如果输入为空，查询当前客户端IP
    if (!trimmedValue) {
      setQuery("");
      await executeQuery();
      return;
    }

    // 验证IP格式
    if (!isValidIP(trimmedValue)) {
      toast.error("Invalid IP address", {
        description: "Enter a valid IPv4 or IPv6 address",
        duration: 3000,
      });
      return;
    }

    // 检查是否为Private或不可达IP address
    const privateCheck = checkPrivateIP(trimmedValue);
    if (privateCheck.isPrivate) {
      toast.warning(privateCheck.message, {
        description: privateCheck.description,
        duration: 5000,
      });
      return;
    }

    setQuery(trimmedValue);
    await executeQuery(trimmedValue);
  };

  const handleInputChangeForVanishInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleInputChange(e.target.value);
  };

  // 处理"Look up my IP"按钮点击事件
  const handleQueryMyIP = async () => {
    // 清空输入框并清除错误状态
    setInputValue("");
    setValidationError("");
    clearError();

    // 设置查询为空字符串并执行查询
    setQuery("");
    await executeQuery();
  };

  // 安全的国旗组件
  const SafeCountryFlag = ({
    countryCode,
    style,
  }: {
    countryCode: string;
    style?: React.CSSProperties;
  }) => {
    try {
      return <ReactCountryFlag countryCode={countryCode} svg style={style} />;
    } catch {
      return (
        <div
          className="bg-gray-200 rounded flex items-center justify-center"
          style={style}
        >
          <Globe className="w-2 h-2 text-gray-500" />
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto px-2 md:px-0"
    >
      {/* 新的输入框 - 使用Placeholders And Vanish Input */}
      <div className="relative">
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleInputChangeForVanishInput}
          onSubmit={handleSubmit}
          value={inputValue}
        />

        {/* 加载状态覆盖层 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[rgb(var(--color-glass-background))] backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          </motion.div>
        )}

        {/* 错误提示 */}
        {(validationError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-red-500 dark:text-red-400 text-sm font-medium transition-colors duration-300"
          >
            {validationError || error}
          </motion.div>
        )}
      </div>

      {/* 快捷操作 - 现在使用Card Hover Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3 justify-center px-2"
      >
        {/* Look up my IP按钮 */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton(0)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <AnimatePresence>
            {hoveredButton === 0 && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-800/40 dark:to-purple-800/40 block rounded-full"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <motion.button
            onClick={handleQueryMyIP}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10 flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full transition-all duration-200 border border-[rgb(var(--color-border))] min-h-[44px] md:min-h-auto"
          >
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[rgb(var(--color-text-secondary))] font-medium">
              Look up my IP
            </span>
          </motion.button>
        </div>

        {/* IPv4 example按钮 */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton(1)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <AnimatePresence>
            {hoveredButton === 1 && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-blue-100/80 dark:bg-blue-800/40 block rounded-full"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <motion.button
            onClick={() => handleInputChange("8.8.8.8")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10 flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm bg-blue-50 dark:bg-blue-900/20 rounded-full transition-all duration-200 border border-blue-200 dark:border-blue-700 min-h-[44px] md:min-h-auto"
          >
            <div className="flex items-center space-x-1.5">
              <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <SafeCountryFlag
                countryCode="US"
                style={{
                  width: "1em",
                  height: "1em",
                  borderRadius: "1px",
                }}
              />
            </div>
            <span className="text-[rgb(var(--color-text-secondary))] font-medium">
              IPv4 example
            </span>
          </motion.button>
        </div>

        {/* IPv6 example按钮 */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton(2)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <AnimatePresence>
            {hoveredButton === 2 && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-purple-100/80 dark:bg-purple-800/40 block rounded-full"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <motion.button
            onClick={() => handleInputChange("2001:4860:4860::8888")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10 flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm bg-purple-50 dark:bg-purple-900/20 rounded-full transition-all duration-200 border border-purple-200 dark:border-purple-700 min-h-[44px] md:min-h-auto"
          >
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <SafeCountryFlag
                countryCode="US"
                style={{
                  width: "1em",
                  height: "1em",
                  borderRadius: "1px",
                }}
              />
            </div>
            <span className="text-[rgb(var(--color-text-secondary))] font-medium">
              IPv6 example
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
