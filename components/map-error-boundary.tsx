'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, MapPin, Globe } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('地图组件错误:', error);
    console.error('错误详情:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[rgb(var(--color-glass-background))] backdrop-blur-sm rounded-2xl shadow-lg border border-[rgb(var(--color-border))] overflow-hidden transition-colors duration-300"
        >
          <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 transition-colors duration-300">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">Map failed to load</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">The map encountered a problem</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center h-64 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 transition-colors duration-300">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1
                }}
                className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-800/40 dark:to-orange-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-colors duration-300"
              >
                <Globe className="w-10 h-10 text-red-500 dark:text-red-400" />
              </motion.div>
              
              <p className="text-[rgb(var(--color-text-secondary))] font-medium mb-4">
                Unable to load the map
              </p>
              
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload map</span>
              </button>

              {/* 错误详情（开发环境显示） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-[rgb(var(--color-text-muted))] cursor-pointer">
                    View error details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-[rgb(var(--color-text-secondary))] overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        {'\n\n'}
                        {this.state.error.stack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="px-6 py-3 bg-[rgb(var(--color-surface))] transition-colors duration-300">
            <div className="flex items-center justify-center text-sm text-[rgb(var(--color-text-muted))]">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Map service is unavailable. Other IP details are still available.</span>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary; 