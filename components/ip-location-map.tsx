"use client";

import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LatLngTuple, Icon } from "leaflet";
import { MapPin, Globe, Copy, CheckCircle, ZoomIn, Shield } from "lucide-react";
import { IPInfo } from "@/lib/store";

// 定义Leaflet地图元素的类型
interface LeafletMapElement extends HTMLElement {
  _leaflet_map?: {
    setView: (center: LatLngTuple, zoom: number, options?: { animate: boolean; duration: number }) => void;
  };
}
import { useState, useEffect, useRef } from "react";
import {
  validateCoordinates,
  getZoomByAccuracy,
  MAP_TILE_PROVIDERS,
  type MapTheme,
} from "@/lib/geoip/map-types";

// 修复 Leaflet 默认图标问题 - CSS已在layout中全局导入

// 自定义地图标记图标
const createCustomIcon = (isDark: boolean) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${
        isDark ? "#ef4444" : "#dc2626"
      }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `)}`,
    shadowUrl: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// 地图 view更新组件
interface MapViewUpdaterProps {
  center: LatLngTuple;
  zoom: number;
}

const MapViewUpdater: React.FC<MapViewUpdaterProps> = ({ center, zoom }) => {
  const map = useMap();
  const prevCenterRef = useRef<LatLngTuple | null>(null);

  useEffect(() => {
    const [newLat, newLng] = center;
    const prevCenter = prevCenterRef.current;

    // 检查坐标是否真的发生了变化（避免不必要的更新）
    if (prevCenter) {
      const [prevLat, prevLng] = prevCenter;
      const latDiff = Math.abs(newLat - prevLat);
      const lngDiff = Math.abs(newLng - prevLng);

      // 如果坐标变化很小（小于0.001度，约100米），则不更新
      if (latDiff < 0.001 && lngDiff < 0.001) {
        return;
      }
    }

    // 平滑移动到新位置
    map.setView(center, zoom, {
      animate: true,
      duration: 1.5, // 1.5秒的平滑动画
      easeLinearity: 0.25,
    });

    // 更新上一次的坐标
    prevCenterRef.current = center;
  }, [center, zoom, map]);

  return null;
};

interface IPLocationMapProps {
  ipData: IPInfo;
  className?: string;
}

export default function IPLocationMap({
  ipData,
  className = "",
}: IPLocationMapProps) {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 检测深色主题
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // 检查坐标有效性
  const coordinateValidation = useMemo(() => {
    const { latitude, longitude } = ipData.location;
    return validateCoordinates(latitude, longitude);
  }, [ipData.location]);

  const isValidCoordinates = coordinateValidation.isValid;

  // 检查是否为PrivateIP
  const isPrivateIP = useMemo(() => {
    const ip = ipData.ip;
    const privateIPv4Ranges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^169\.254\./,
      /^0\.0\.0\.0$/,
      /^255\.255\.255\.255$/,
    ];

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
  }, [ipData.ip]);

  // 计算地图缩放级别
  const zoomLevel = useMemo(() => {
    return getZoomByAccuracy(ipData.accuracy, ipData.location.accuracy_radius);
  }, [ipData.accuracy, ipData.location.accuracy_radius]);

  // 地图中心点
  const mapCenter: LatLngTuple = useMemo(
    () => [ipData.location.latitude, ipData.location.longitude],
    [ipData.location]
  );

  // 地图瓦片配置
  const tileProvider = useMemo(() => {
    const theme: MapTheme = isDark ? "dark" : "light";
    return MAP_TILE_PROVIDERS[theme];
  }, [isDark]);

  // 复制坐标
  const copyCoordinates = useCallback(async () => {
    try {
      const coordsText = `${ipData.location.latitude.toFixed(
        6
      )}, ${ipData.location.longitude.toFixed(6)}`;
      await navigator.clipboard.writeText(coordsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy coordinates:", err);
    }
  }, [ipData.location]);

  // 格式化位置信息
  const formatLocation = useCallback(() => {
    const parts = [];
    if (ipData.country) parts.push(ipData.country);
    if (ipData.province) parts.push(ipData.province);
    if (ipData.city) parts.push(ipData.city);
    if (ipData.district) parts.push(ipData.district);
    return parts.join(" · ");
  }, [ipData]);

  // 获取Accuracy文本
  const getAccuracyText = useCallback(() => {
    const { accuracy_radius } = ipData.location;
    if (accuracy_radius) {
      return `Accuracy radius: ~${accuracy_radius}km`;
    }
    return ipData.accuracy === "high"
      ? "High"
      : ipData.accuracy === "medium"
      ? "Medium"
      : "Low";
  }, [ipData.location, ipData.accuracy]);

  // 无效坐标或PrivateIP的占位符组件
  if (!isValidCoordinates || isPrivateIP) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-[rgb(var(--color-glass-background))] backdrop-blur-sm rounded-2xl shadow-lg border border-[rgb(var(--color-border))] overflow-hidden transition-colors duration-300 ${className}`}
      >
        {/* 简化头部信息 */}
        <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[rgb(var(--color-surface-hover))] transition-colors duration-300">
              <MapPin className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                Location
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                {formatLocation()}
              </p>
            </div>
          </div>
        </div>

        {/* 占位符内容 */}
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-[rgb(var(--color-background-secondary))] to-[rgb(var(--color-surface-hover))] transition-colors duration-300">
          {/* 装饰性网格背景 */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(var(--color-text-muted)) 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          <div className="text-center relative z-10">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.3,
              }}
              className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-colors duration-300"
            >
              {isPrivateIP ? (
                <Shield className="w-10 h-10 text-gray-600 dark:text-gray-400" />
              ) : (
                <Globe className="w-10 h-10 text-gray-500 dark:text-gray-400" />
              )}
            </motion.div>
            <p className="text-[rgb(var(--color-text-secondary))] font-medium mb-2">
              {isPrivateIP ? "Private network address" : "Location unavailable"}
            </p>
            <div className="inline-flex items-center space-x-2 bg-[rgb(var(--color-surface))]/80 px-3 py-1.5 rounded-full text-sm text-[rgb(var(--color-text-muted))] transition-colors duration-300">
              <MapPin className="w-4 h-4" />
              <span>{isPrivateIP ? "Local network" : "No valid coordinates"}</span>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="px-6 py-3 bg-[rgb(var(--color-surface))] transition-colors duration-300">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[rgb(var(--color-text-muted))]">
              Data source: {ipData.source}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-400/15 dark:bg-blue-300/10 ring-1 ring-inset ring-blue-400/25 text-blue-700 dark:text-blue-400 transition-colors duration-300">
              {isPrivateIP ? "Local network" : "Unknown location"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 有效坐标的地图组件
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-[rgb(var(--color-glass-background))] backdrop-blur-sm rounded-2xl shadow-lg border border-[rgb(var(--color-border))] overflow-hidden transition-colors duration-300 ${className}`}
    >
      {/* 地图头部信息 */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[rgb(var(--color-border))] transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-[rgb(var(--color-surface-hover))] transition-colors duration-300">
              <MapPin className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                Location
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                {formatLocation()}
              </p>
            </div>
          </div>

          <button
            onClick={copyCoordinates}
            className="flex items-center space-x-2 px-3 py-2 md:py-1.5 rounded-lg hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200 group min-h-[44px] md:min-h-auto flex-shrink-0"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-text-secondary))]" />
            )}
            <span className="text-sm text-[rgb(var(--color-text-secondary))] font-mono">
              {ipData.location.latitude.toFixed(4)}°,{" "}
              {ipData.location.longitude.toFixed(4)}°
            </span>
          </button>
        </div>
      </div>

      {/* 地图容器 */}
      <div className="relative h-48 md:h-64 bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={true}
          className="z-0"
        >
          <TileLayer
            url={tileProvider.url}
            attribution={tileProvider.attribution}
            maxZoom={tileProvider.maxZoom}
          />

          {/* 地图 view更新组件 */}
          <MapViewUpdater center={mapCenter} zoom={zoomLevel} />

          <Marker position={mapCenter} icon={createCustomIcon(isDark)}>
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {formatLocation()}
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>Latitude: {ipData.location.latitude.toFixed(6)}°</div>
                  <div>Longitude: {ipData.location.longitude.toFixed(6)}°</div>
                  <div>{getAccuracyText()}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* 缩放控制按钮 */}
        <div className="absolute top-4 right-4 z-10">
          <button
            className="p-2 liquid-glass rounded-full transition-transform duration-200 hover:scale-105"
            onClick={() => {
              // 触发地图重新定位到标记点并放大
              const mapElement = document.querySelector(
                ".leaflet-container"
              ) as LeafletMapElement;
              if (mapElement && mapElement._leaflet_map) {
                const map = mapElement._leaflet_map;
                map.setView(mapCenter, Math.min(zoomLevel + 2, 18), {
                  animate: true,
                  duration: 1.0,
                });
              }
            }}
          >
            <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* 地图底部信息 */}
      <div className="px-4 md:px-6 py-3 bg-[rgb(var(--color-surface))] transition-colors duration-300">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[rgb(var(--color-text-muted))]">
            Data source: {ipData.source}
          </span>
          <span
            className={`
            px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300
            ${
              ipData.accuracy === "high"
                ? "bg-green-400/15 dark:bg-green-300/10 ring-1 ring-inset ring-green-400/25 text-green-700 dark:text-green-400"
                : ipData.accuracy === "medium"
                ? "bg-yellow-400/15 dark:bg-yellow-300/10 ring-1 ring-inset ring-yellow-400/25 text-yellow-700 dark:text-yellow-400"
                : "bg-red-400/15 dark:bg-red-300/10 ring-1 ring-inset ring-red-400/25 text-red-700 dark:text-red-400"
            }
          `}
          >
            {getAccuracyText()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
