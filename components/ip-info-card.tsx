"use client";

import React from "react";
import { motion } from "framer-motion";
import ReactCountryFlag from "react-country-flag";
import {
  MapPin,
  Globe,
  Wifi,
  Clock,
  Building,
  Shield,
  Copy,
  Search,
  Loader2,
  Network,
  Router,
  MapIcon,
  Zap,
  Eye,
  Hash,
  Flag,
  Building2,
  Server,
  Layers,
  Activity,
  CheckCircle,
  HelpCircle,
  Shuffle,
} from "lucide-react";
import { IPInfo, useIPQueryStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import LazyIPMap from "@/components/lazy-ip-map";
import BGPPeersDialog from "@/components/bgp-peers-dialog";
import { toast } from "sonner";

interface IPInfoCardProps {
  ipData: IPInfo;
}

export default function IPInfoCard({ ipData }: IPInfoCardProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isTracing, setIsTracing] = useState(false);
  const [tracedData, setTracedData] = useState<IPInfo | null>(null);
  const [currentData, setCurrentData] = useState<IPInfo>(ipData);
  const [isBGPDialogOpen, setIsBGPDialogOpen] = useState(false);
  const [selectedASN, setSelectedASN] = useState<{
    asn: number;
    name?: string;
  } | null>(null);

  // 获取store中的Connection check状态和自动检测状态
  const { isProxyDetecting, executeProxyDetection, isAutoDetected } = useIPQueryStore();

  // Trace功能
  const handleTrace = async () => {
    if (isTracing) return;

    setIsTracing(true);
    try {
      const response = await fetch("/api/meituan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip: ipData.ip }),
      });

      if (!response.ok) {
        throw new Error(`Trace failed: ${response.statusText}`);
      }

      const meituanData: IPInfo = await response.json();
      setTracedData(meituanData);
      setCurrentData(meituanData);

      toast.success("Trace complete", {
        description: `Retrieved location details from Meituan`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Trace failed:", error);
      toast.error("Trace failed", {
        description:
          error instanceof Error ? error.message : "Unable to retrieve Meituan data",
        duration: 4000,
      });
    } finally {
      setIsTracing(false);
    }
  };

  // Reset到原始数据
  const resetToOriginal = () => {
    setCurrentData(ipData);
    setTracedData(null);
  };

  // Update current time only on client side to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      if (currentData.timezone) {
        setCurrentTime(
          new Date().toLocaleString("en-US", {
            timeZone: currentData.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    };

    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [currentData.timezone]);

  // 当原始数据变化时，Reset状态
  useEffect(() => {
    setCurrentData(ipData);
    setTracedData(null);
  }, [ipData]);

  // BGP 对话框处理函数
  const handleASNClick = (asn: number, name?: string) => {
    setSelectedASN({ asn, name });
    setIsBGPDialogOpen(true);
  };

  const handleBGPDialogClose = () => {
    setIsBGPDialogOpen(false);
    setSelectedASN(null);
  };

  // Connection check处理函数
  const handleProxyDetection = async () => {
    if (isProxyDetecting) return;
    await executeProxyDetection();
  };

  // 获取代理类型的显示信息
  const getProxyTypeInfo = (proxyType: string) => {
    switch (proxyType) {
      case 'direct':
        return {
          text: 'Direct',
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/30'
        };
      case 'domestic':
        return {
          text: 'Domestic proxy',
          icon: Shield,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/30'
        };
      case 'foreign':
        return {
          text: 'Foreign proxy',
          icon: Globe,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/30'
        };
      case 'mixed':
        return {
          text: 'Mixed proxy',
          icon: Shuffle,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/30'
        };
      default:
        return {
          text: 'Unknown',
          icon: HelpCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/30'
        };
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied", {
        description: `${type}: ${text}`,
        duration: 2000,
      });
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Copy failed", {
        description: "Clipboard unavailable. Please copy manually.",
        duration: 3000,
      });
    }
  };

  // 检查是否为有效的Country code
  const isValidCountryCode = (code: string) => {
    return (
      code &&
      code.length === 2 &&
      code !== "XX" &&
      code !== "--" &&
      code.toUpperCase() !== "PRIVATE" &&
      code.toUpperCase() !== "ZZ" &&
      code !== "**"
    );
  };

  // 检查是否为PrivateIP
  const isPrivateIP = (ip: string) => {
    // PrivateIPv4地址范围
    const privateIPv4Ranges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^169\.254\./,
      /^0\.0\.0\.0$/,
      /^255\.255\.255\.255$/,
    ];

    // PrivateIPv6地址
    const privateIPv6Ranges = [
      /^::1$/,
      /^fc[0-9a-f]{2}:/i,
      /^fd[0-9a-f]{2}:/i,
      /^fe80:/i,
    ];

    return (
      privateIPv4Ranges.some((range) => range.test(ip)) ||
      privateIPv6Ranges.some((range) => range.test(ip))
    );
  };

  // 格式化位置信息（支持美团数据）
  const formatLocationWithMeituan = () => {
    if (currentData.source === "MeiTuan" && currentData.meituan?.areaName) {
      // 美团数据：显示更详细的区域信息
      const parts = [currentData.country];
      if (currentData.province) parts.push(currentData.province);
      if (currentData.city) parts.push(currentData.city);
      if (currentData.district) parts.push(currentData.district);
      if (currentData.meituan.areaName)
        parts.push(currentData.meituan.areaName);
      return parts.join(" · ");
    }

    // 原始数据格式
    return formatLocation();
  };

  // 国旗组件，带有错误处理
  const CountryFlagWithFallback = ({
    countryCode,
    style,
    className = "",
  }: {
    countryCode: string;
    style?: React.CSSProperties;
    className?: string;
  }) => {
    const isPrivate = isPrivateIP(currentData.ip);

    if (!isValidCountryCode(countryCode) || isPrivate) {
      return (
        <div
          className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center ${className}`}
          style={style}
          title={isPrivate ? "Private address" : "Unknown region"}
        >
          {isPrivate ? (
            <Shield className="w-3 h-3 text-gray-600" />
          ) : (
            <Globe className="w-3 h-3 text-gray-500" />
          )}
        </div>
      );
    }

    try {
      return (
        <ReactCountryFlag
          countryCode={countryCode.toUpperCase()}
          svg
          style={style}
          className={className}
          title={currentData.country}
        />
      );
    } catch {
      return (
        <div
          className={`bg-gray-200 rounded flex items-center justify-center ${className}`}
          style={style}
          title="Flag unavailable"
        >
          <Globe className="w-3 h-3 text-gray-500" />
        </div>
      );
    }
  };

  const formatLocation = () => {
    const parts = [currentData.country];
    if (currentData.province) parts.push(currentData.province);
    if (currentData.city) parts.push(currentData.city);
    if (currentData.district) parts.push(currentData.district);
    return parts.join(" · ");
  };



  // 格式化简化区域信息
  const formatRegionsShort = () => {
    if (currentData.regions_short) {
      return currentData.regions_short.join(" · ");
    }
    return null;
  };

  const getVersionColor = (version: string) => {
    return version === "IPv4" ? "text-blue-500" : "text-purple-500";
  };

  const getVersionBg = (version: string) => {
    return version === "IPv4"
      ? "bg-blue-50 dark:bg-blue-950/50"
      : "bg-purple-50 dark:bg-purple-950/50";
  };

  // 获取Data source颜色
  const getSourceColor = (source: string) => {
    if (source === "MeiTuan") return "text-yellow-600";
    return source === "MaxMind" ? "text-blue-600" : "text-green-600";
  };

  const getSourceBg = (source: string) => {
    if (source === "MeiTuan") return "bg-yellow-100 dark:bg-yellow-900/30";
    return source === "MaxMind"
      ? "bg-blue-100 dark:bg-blue-900/30"
      : "bg-green-100 dark:bg-green-900/30";
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto"
    >
      {/* 主IP展示卡片 */}
      <motion.div
        variants={itemVariants}
        className="bg-[rgb(var(--color-glass-background))] backdrop-blur-sm rounded-3xl shadow-xl border border-[rgb(var(--color-border))] overflow-hidden transition-colors duration-300"
      >
        {/* 头部 - IP address */}
        <div
          className={`px-4 md:px-8 py-4 md:py-6 ${getVersionBg(
            currentData.ipVersion
          )} border-b border-[rgb(var(--color-border))] transition-colors duration-300`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
              <div
                className={`p-3 rounded-2xl ${getVersionBg(
                  currentData.ipVersion
                )} border border-[rgb(var(--color-border))] transition-colors duration-300`}
              >
                <Wifi
                  className={`w-6 h-6 ${getVersionColor(
                    currentData.ipVersion
                  )}`}
                />
              </div>

              <div>
                <div className="mb-1">
                  <TextGenerateEffect
                    words={currentData.ip}
                    className="text-xl md:text-3xl font-mono font-bold text-[rgb(var(--color-text-primary))] break-all"
                    duration={0.3}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getVersionColor(
                      currentData.ipVersion
                    )} bg-[rgb(var(--color-surface))] dark:bg-[rgb(var(--color-surface-hover))] transition-colors duration-300`}
                  >
                    {currentData.ipVersion}
                  </span>
                  <div className="flex items-center space-x-2">
                    <CountryFlagWithFallback
                      countryCode={currentData.countryCode}
                      style={{
                        width: "1.2em",
                        height: "1.2em",
                        borderRadius: "2px",
                      }}
                    />
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">
                      {isPrivateIP(currentData.ip)
                        ? "Local network"
                        : currentData.country}
                    </span>
                    {isPrivateIP(currentData.ip) && (
                      <span className="text-xs text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-surface-hover))] px-2 py-0.5 rounded-full transition-colors duration-300">
                        Private
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full transition-colors duration-300 ${getSourceBg(
                      currentData.source
                    )} ${getSourceColor(currentData.source)}`}
                  >
                    {currentData.source}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Trace按钮 */}
              {!(["IPWhois", "Geoapify"] as string[]).includes(currentData.source) && currentData.source !== "MeiTuan" &&
                !isPrivateIP(currentData.ip) && (
                  <button
                    onClick={handleTrace}
                    disabled={isTracing}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTracing ? (
                      <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      {isTracing ? "Looking up..." : "Trace"}
                    </span>
                  </button>
                )}

              {/* Connection check按钮 - 只在查询用户自己的IP时显示 */}
              {!(["IPWhois", "Geoapify"] as string[]).includes(currentData.source) && isAutoDetected && !isPrivateIP(currentData.ip) && (
                <button
                  onClick={handleProxyDetection}
                  disabled={isProxyDetecting}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Check your current connection"
                >
                  {isProxyDetecting ? (
                    <Loader2 className="w-4 h-4 text-cyan-600 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4 text-cyan-600" />
                  )}
                  <span className="text-sm font-medium text-cyan-700 dark:text-cyan-400">
                    {isProxyDetecting ? "Checking..." : "Connection check"}
                  </span>
                </button>
              )}

              {/* Reset按钮 - 仅在已Trace时显示 */}
              {tracedData && (
                <button
                  onClick={resetToOriginal}
                  className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors duration-200 text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  Reset
                </button>
              )}

              {/* 复制按钮 */}
              <button
                onClick={() => copyToClipboard(currentData.ip, "IP address")}
                className="p-2 rounded-xl hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200"
              >
                <Copy className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
              </button>
            </div>
          </div>
        </div>

        {/* 详细信息网格 */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Location */}
            <motion.div
              variants={itemVariants}
              className="space-y-4 md:space-y-3"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                  Location
                </h3>
              </div>

              <div className="pl-6 md:pl-7 space-y-4 md:space-y-3">
                <div className="flex items-center space-x-3">
                  <CountryFlagWithFallback
                    countryCode={currentData.countryCode}
                    style={{
                      width: "2em",
                      height: "2em",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                  <div>
                    <p className="text-lg font-medium text-[rgb(var(--color-text-primary))]">
                      {formatLocationWithMeituan()}
                    </p>
                    {formatRegionsShort() && (
                      <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                        Short name: {formatRegionsShort()}
                      </p>
                    )}
                    {/* 美团特有信息 */}
                    {currentData.source === "MeiTuan" &&
                      currentData.meituan?.detail && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          Street address: {currentData.meituan.detail}
                        </p>
                      )}
                  </div>
                </div>
                {currentData.postal && (
                  <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                    Postal code: {currentData.postal}
                  </p>
                )}
                <div className="text-sm text-[rgb(var(--color-text-muted))] space-y-1">
                  <p>Latitude: {currentData.location.latitude.toFixed(4)}°</p>
                  <p>Longitude: {currentData.location.longitude.toFixed(4)}°</p>
                  {currentData.location.accuracy_radius && (
                    <p>Accuracy radius: ~{currentData.location.accuracy_radius}km</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Network information - 增强ASN展示 */}
            <motion.div
              variants={itemVariants}
              className="space-y-4 md:space-y-3"
            >
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                  Network information
                </h3>
              </div>
              <div className="pl-6 md:pl-7 space-y-4 md:space-y-3">
                {/* ASN number */}
                {currentData.as?.number && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        ASN number
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleASNClick(
                          currentData.as!.number!,
                          currentData.as?.name
                        )
                      }
                      className="font-mono text-sm bg-[rgb(var(--color-surface-hover))] hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded text-[rgb(var(--color-text-primary))] hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                      title="View BGP peers"
                    >
                      AS{currentData.as.number}
                    </button>
                  </div>
                )}

                {/* ASN organization */}
                {currentData.as?.name && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        ASN organization
                      </span>
                    </div>
                    <span className="font-medium text-right text-[rgb(var(--color-text-primary))] max-w-xs break-words">
                      {currentData.as.name}
                    </span>
                  </div>
                )}

                {/* 中文ISP信息 */}
                {currentData.as?.info && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Router className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Provider
                      </span>
                    </div>
                    <span className="font-medium text-[rgb(var(--color-text-primary))]">
                      {currentData.as.info}
                    </span>
                  </div>
                )}

                {/* 传统ISP字段 */}
                {currentData.isp && !currentData.as?.info && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Router className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Provider
                      </span>
                    </div>
                    <span className="font-medium text-[rgb(var(--color-text-primary))]">
                      {currentData.isp}
                    </span>
                  </div>
                )}

                {/* Network type */}
                {currentData.type && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Network type
                      </span>
                    </div>
                    <span className="font-medium text-[rgb(var(--color-text-primary))]">
                      {currentData.type}
                    </span>
                  </div>
                )}

                {/* 网络地址 */}
                {currentData.net && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Network prefix
                      </span>
                    </div>
                    <span className="font-mono text-sm text-[rgb(var(--color-text-primary))]">
                      {currentData.net}
                    </span>
                  </div>
                )}

                {/* 数据Accuracy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                    <span className="text-[rgb(var(--color-text-secondary))]">
                      Accuracy
                    </span>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 transition-colors duration-300
                    ${
                      currentData.accuracy === "high"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : currentData.accuracy === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }
                  `}
                  >
                    <Zap className="w-3 h-3" />
                    <span>
                      {currentData.accuracy === "high"
                        ? "High"
                        : currentData.accuracy === "medium"
                        ? "Medium"
                        : "Low"}
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Connection check results - 只在查询用户自己的IP时显示 */}
            {!(["IPWhois", "Geoapify"] as string[]).includes(currentData.source) && isAutoDetected && currentData.proxyDetection && (
              <motion.div
                variants={itemVariants}
                className="space-y-4 md:space-y-3 md:col-span-2"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                    Connection check results
                  </h3>
                </div>

                <div className="pl-6 md:pl-7 space-y-4 md:space-y-3">
                  {/* 检测状态 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Connection status
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const { text, icon: Icon, color, bgColor } = getProxyTypeInfo(currentData.proxyDetection.proxyType);
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${bgColor} ${color}`}>
                            <Icon className="w-3 h-3" />
                            <span>{text}</span>
                          </span>
                        );
                      })()}
                      <span className="text-xs text-[rgb(var(--color-text-muted))]">
                        Confidence: {Math.round(currentData.proxyDetection.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* IP对比信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Headers IP */}
                    <div className="bg-[rgb(var(--color-surface))] rounded-lg p-3">
                      <div className="text-xs text-[rgb(var(--color-text-muted))] mb-1">Headers IP</div>
                      <div className="font-mono text-sm text-[rgb(var(--color-text-primary))]">
                        {currentData.proxyDetection.headerIP || 'Unavailable'}
                      </div>
                    </div>

                    {/* Domestic sourceIP */}
                    <div className="bg-[rgb(var(--color-surface))] rounded-lg p-3">
                      <div className="text-xs text-[rgb(var(--color-text-muted))] mb-1">Domestic source</div>
                      <div className="font-mono text-sm text-[rgb(var(--color-text-primary))]">
                        {currentData.proxyDetection.domesticIP || 'Unavailable'}
                      </div>
                    </div>

                    {/* International sourceIP */}
                    <div className="bg-[rgb(var(--color-surface))] rounded-lg p-3">
                      <div className="text-xs text-[rgb(var(--color-text-muted))] mb-1">International source</div>
                      <div className="font-mono text-sm text-[rgb(var(--color-text-primary))]">
                        {currentData.proxyDetection.foreignIP || 'Unavailable'}
                      </div>
                    </div>
                  </div>

                  {/* 检测详情 */}
                  <div className="text-xs text-[rgb(var(--color-text-muted))] space-y-1">
                    <p>Check duration: {currentData.proxyDetection.detectionTime}ms</p>
                    {currentData.proxyDetection.errors.length > 0 && (
                      <div>
                        <p className="text-orange-600 dark:text-orange-400">Warnings:</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          {currentData.proxyDetection.errors.map((error, index) => (
                            <li key={index} className="text-orange-600 dark:text-orange-400">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Time zone */}
            {currentData.timezone && (
              <motion.div
                variants={itemVariants}
                className="space-y-4 md:space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                    Time zone
                  </h3>
                </div>
                <div className="pl-6 md:pl-7 space-y-3 md:space-y-2">
                  <p className="font-mono text-[rgb(var(--color-text-primary))]">
                    {currentData.timezone}
                  </p>
                  {currentTime && (
                    <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                      Local time: {currentTime}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Registered country信息 */}
            {currentData.registered_country && (
              <motion.div
                variants={itemVariants}
                className="space-y-4 md:space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                  <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                    Registration
                  </h3>
                </div>
                <div className="pl-6 md:pl-7 space-y-4 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Registered country
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CountryFlagWithFallback
                        countryCode={currentData.registered_country.code}
                        style={{
                          width: "1.2em",
                          height: "1.2em",
                          borderRadius: "2px",
                        }}
                      />
                      <span className="font-medium text-[rgb(var(--color-text-primary))]">
                        {currentData.registered_country.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapIcon className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Registration code
                      </span>
                    </div>
                    <span className="font-mono text-sm bg-[rgb(var(--color-surface-hover))] px-2 py-1 rounded text-[rgb(var(--color-text-primary))] transition-colors duration-300">
                      {currentData.registered_country.code}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 其他Region codes信息 */}
            {(currentData.countryCode ||
              currentData.provinceCode ||
              currentData.cityCode) && (
              <motion.div
                variants={itemVariants}
                className="space-y-4 md:space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                  <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                    Region codes
                  </h3>
                </div>
                <div className="pl-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                      <span className="text-[rgb(var(--color-text-secondary))]">
                        Country code
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CountryFlagWithFallback
                        countryCode={currentData.countryCode}
                        style={{
                          width: "1.2em",
                          height: "1.2em",
                          borderRadius: "2px",
                        }}
                      />
                      <span className="font-mono text-sm bg-[rgb(var(--color-surface-hover))] px-2 py-1 rounded text-[rgb(var(--color-text-primary))] transition-colors duration-300">
                        {currentData.countryCode}
                      </span>
                    </div>
                  </div>

                  {currentData.provinceCode && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapIcon className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                        <span className="text-[rgb(var(--color-text-secondary))]">
                          Region code
                        </span>
                      </div>
                      <span className="font-mono text-sm bg-[rgb(var(--color-surface-hover))] px-2 py-1 rounded text-[rgb(var(--color-text-primary))] transition-colors duration-300">
                        {currentData.provinceCode}
                      </span>
                    </div>
                  )}
                  {currentData.cityCode && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
                        <span className="text-[rgb(var(--color-text-secondary))]">
                          City code
                        </span>
                      </div>
                      <span className="font-mono text-sm bg-[rgb(var(--color-surface-hover))] px-2 py-1 rounded text-[rgb(var(--color-text-primary))] transition-colors duration-300">
                        {currentData.cityCode}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 地图组件 */}
      <motion.div variants={itemVariants} className="mt-6">
        <LazyIPMap ipData={currentData} />
      </motion.div>

      {/* BGP peers对话框 */}
      {selectedASN && (
        <BGPPeersDialog
          asn={selectedASN.asn}
          asnName={selectedASN.name}
          isOpen={isBGPDialogOpen}
          onClose={handleBGPDialogClose}
        />
      )}
    </motion.div>
  );
}
