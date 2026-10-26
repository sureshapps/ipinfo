'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, Smartphone, Monitor } from 'lucide-react';
import { IPInfo } from '@/lib/store';
import LazyIPMap from './lazy-ip-map';

interface ResponsiveMapProps {
  ipData: IPInfo;
  className?: string;
}

export default function ResponsiveMap({ ipData, className }: ResponsiveMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
        setIsMobile(true);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 计算地图高度
  const mapHeight = useMemo(() => {
    if (isExpanded) {
      return isMobile ? 'h-80' : 'h-96';
    }
    return screenSize === 'mobile' ? 'h-48' : 'h-64';
  }, [isExpanded, isMobile, screenSize]);

  // 切换Expand状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      layout
      className={`relative ${className}`}
      initial={false}
      animate={{
        scale: isExpanded && isMobile ? 1.02 : 1,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
    >
      {/* 地图控制栏 */}
      <motion.div
        className="flex items-center justify-between p-4 bg-[rgb(var(--color-glass-background))] backdrop-blur-sm border-b border-[rgb(var(--color-border))] transition-colors duration-300"
        layout
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isMobile ? (
              <Smartphone className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
            ) : (
              <Monitor className="w-4 h-4 text-[rgb(var(--color-text-muted))]" />
            )}
            <span className="text-sm text-[rgb(var(--color-text-secondary))]">
              {screenSize === 'mobile' ? 'Mobile' : screenSize === 'tablet' ? 'Tablet' : 'Desktop'} view
            </span>
          </div>
        </div>

        <button
          onClick={toggleExpanded}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200 group"
          aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-4 h-4 text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-text-secondary))]" />
              <span className="text-sm text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-text-secondary))]">
                Collapse
              </span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-text-secondary))]" />
              <span className="text-sm text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-text-secondary))]">
                Expand
              </span>
            </>
          )}
        </button>
      </motion.div>

      {/* 地图容器 */}
      <motion.div
        layout
        className={`${mapHeight} transition-all duration-300 ease-in-out`}
        style={{
          // 为Mobile优化触摸体验
          touchAction: isMobile ? 'pan-x pan-y' : 'auto',
        }}
      >
        <LazyIPMap 
          ipData={ipData} 
          className="h-full w-full rounded-none"
        />
      </motion.div>

      {/* Mobile提示 */}
      {isMobile && !isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Expand to view the full map
          </div>
        </motion.div>
      )}

      {/* Expand状态下的额外信息 */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] p-4 transition-colors duration-300"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-[rgb(var(--color-text-secondary))]">Location accuracy:</span>
              <span className="ml-2 font-medium text-[rgb(var(--color-text-primary))]">
                {ipData.accuracy === 'high' ? 'High' : 
                 ipData.accuracy === 'medium' ? 'Medium' : 'Low'}
              </span>
            </div>
            
            {ipData.location.accuracy_radius && (
              <div>
                <span className="text-[rgb(var(--color-text-secondary))]">Accuracy radius:</span>
                <span className="ml-2 font-medium text-[rgb(var(--color-text-primary))]">
                  ~{ipData.location.accuracy_radius}km
                </span>
              </div>
            )}
            
            <div>
              <span className="text-[rgb(var(--color-text-secondary))]">Data source:</span>
              <span className="ml-2 font-medium text-[rgb(var(--color-text-primary))]">
                {ipData.source}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 