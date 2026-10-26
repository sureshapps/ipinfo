'use client';

import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { IPInfo } from '@/lib/store';
import MapErrorBoundary from './map-error-boundary';

// 懒加载地图组件
const IPLocationMap = lazy(() => import('./ip-location-map'));

interface LazyIPMapProps {
  ipData: IPInfo;
  className?: string;
}

// 地图加载状态组件
const MapLoadingPlaceholder = ({ className }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`bg-[rgb(var(--color-glass-background))] backdrop-blur-sm rounded-2xl shadow-lg border border-[rgb(var(--color-border))] overflow-hidden transition-colors duration-300 ${className || ''}`}
  >
    <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] transition-colors duration-300">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-[rgb(var(--color-surface-hover))] transition-colors duration-300">
          <MapPin className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">Location</h3>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading...</p>
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-[rgb(var(--color-background-secondary))] to-[rgb(var(--color-surface-hover))] transition-colors duration-300">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </motion.div>
        <p className="text-[rgb(var(--color-text-secondary))]">Loading map...</p>
      </div>
    </div>
  </motion.div>
);

export default function LazyIPMap({ ipData, className }: LazyIPMapProps) {
  return (
    <MapErrorBoundary>
      <Suspense fallback={<MapLoadingPlaceholder className={className} />}>
        <IPLocationMap ipData={ipData} className={className} />
      </Suspense>
    </MapErrorBoundary>
  );
} 