'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { fetchBGPPeers, ProcessedBGPData } from '@/lib/bgp-api';
import BGPNetworkChart from '@/components/bgp-network-chart';
import { Loader2, AlertCircle, Network, Globe, Hash, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface BGPPeersDialogProps {
  asn: number;
  asnName?: string;
  isOpen: boolean;
  onClose: () => void;
}

type ProtocolType = 'ipv4' | 'ipv6' | 'both';

export default function BGPPeersDialog({ 
  asn, 
  asnName, 
  isOpen, 
  onClose 
}: BGPPeersDialogProps) {
  const [bgpData, setBgpData] = useState<ProcessedBGPData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocolType, setProtocolType] = useState<ProtocolType>('both');

  const fetchBGPData = useCallback(async () => {
    if (!asn) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchBGPPeers(asn);
      setBgpData(data);
      
      toast.success("BGP data loaded", {
        description: `Found ${data.allPeers.length} peer relationships`,
        duration: 1000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to load BGP data';
      setError(errorMessage);
      
      toast.error("Unable to load BGP data", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [asn]);

  // 当对话框打开且 ASN 改变时，获取数据
  useEffect(() => {
    if (isOpen && asn) {
      fetchBGPData();
    }
  }, [isOpen, asn, fetchBGPData]);

  // 当对话框关闭时Reset状态
  useEffect(() => {
    if (!isOpen) {
      setBgpData(null);
      setError(null);
    }
  }, [isOpen]);

  const handleRetry = () => {
    fetchBGPData();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[95vw] w-full max-h-[90vh] overflow-hidden liquid-glass-strong sm:!max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-blue-500" />
            <span>BGP peers</span>
          </DialogTitle>
          <DialogDescription>
            AS{asn} {asnName && `(${asnName})`} BGP peer connections
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium text-[rgb(var(--color-text-primary))]">
                  Loading BGP data...
                </p>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">
                  Please wait. This may take a few seconds.
                </p>
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-[rgb(var(--color-text-primary))]">
                  Unable to load data
                </p>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] max-w-md">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* 数据展示 */}
          {bgpData && !isLoading && !error && (
            <div className="space-y-6">
              {/* 统计信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">Target ASN</span>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))] mt-1">
                    AS{bgpData.centerAsn}
                  </p>
                </div>
                
                <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">
                      {protocolType === 'ipv4' ? 'IPv4 peers' : 
                       protocolType === 'ipv6' ? 'IPv6 peers' : 'Total peers'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))] mt-1">
                    {protocolType === 'ipv4' ? bgpData.ipv4Peers.length :
                     protocolType === 'ipv6' ? bgpData.ipv6Peers.length :
                     bgpData.allPeers.length}
                  </p>
                </div>
                
                <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">IPv4 peers</span>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))] mt-1">
                    {bgpData.ipv4Peers.length}
                  </p>
                </div>
                
                <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">IPv6 peers</span>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))] mt-1">
                    {bgpData.ipv6Peers.length}
                  </p>
                </div>
              </div>

              {/* 网络关系图 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
                      Network topology
                    </h3>
                  </div>
                  
                  {/* Protocol切换控件 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">Protocol:</span>
                    <div className="flex bg-[rgb(var(--color-surface-hover))] rounded-lg p-1 border border-[rgb(var(--color-border))]">
                      <button
                        onClick={() => setProtocolType('ipv4')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                          protocolType === 'ipv4'
                            ? 'bg-blue-500 text-white'
                            : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
                        }`}
                      >
                        IPv4
                      </button>
                      <button
                        onClick={() => setProtocolType('ipv6')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                          protocolType === 'ipv6'
                            ? 'bg-purple-500 text-white'
                            : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
                        }`}
                      >
                        IPv6
                      </button>
                      <button
                        onClick={() => setProtocolType('both')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                          protocolType === 'both'
                            ? 'bg-emerald-500 text-white'
                            : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
                  <BGPNetworkChart 
                    data={bgpData}
                    protocolType={protocolType}
                    className="min-h-[400px]"
                  />
                </div>
                
                <div className="text-xs text-[rgb(var(--color-text-muted))] space-y-1">
                  <p>• Drag nodes to adjust the layout; scroll to zoom</p>
                  <p>• Hover over a node to see details</p>
                  <p>• Line colors indicate the peer connection type</p>
                  <p>• Solid blue lines indicate IPv4; dashed purple lines indicate IPv6</p>
                </div>
              </div>

              {/* Peer list */}
              {bgpData.allPeers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
                      Peer list
                    </h3>
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">
                      {protocolType === 'ipv4' ? `IPv4: ${bgpData.ipv4Peers.length} nodes` :
                       protocolType === 'ipv6' ? `IPv6: ${bgpData.ipv6Peers.length} nodes` :
                       `Total: ${bgpData.allPeers.length} nodes`}
                    </span>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {(protocolType === 'ipv4' ? bgpData.ipv4Peers :
                      protocolType === 'ipv6' ? bgpData.ipv6Peers :
                      bgpData.allPeers).slice(0, 20).map((peer) => (
                      <div 
                        key={peer.asn}
                        className="flex items-center justify-between p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg border border-[rgb(var(--color-border))] transition-colors duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {/* 类型指示器 */}
                            <div className={`w-3 h-3 rounded-full ${
                              protocolType === 'both' && bgpData.ipv4Peers.some(p => p.asn === peer.asn) && 
                              bgpData.ipv6Peers.some(p => p.asn === peer.asn) 
                                ? 'bg-emerald-500' 
                                : protocolType === 'both' && bgpData.ipv6Peers.some(p => p.asn === peer.asn)
                                  ? 'bg-purple-500'
                                  : protocolType === 'both' && bgpData.ipv4Peers.some(p => p.asn === peer.asn)
                                    ? 'bg-blue-500'
                                    : protocolType === 'ipv4'
                                      ? 'bg-blue-500'
                                      : 'bg-purple-500'
                            }`}></div>
                            
                            <span className="font-mono text-sm font-medium text-[rgb(var(--color-text-primary))]">
                              AS{peer.asn}
                            </span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                              {peer.name}
                            </span>
                            <span className="text-xs text-[rgb(var(--color-text-secondary))]">
                              {peer.description}
                            </span>
                          </div>
                        </div>
                        
                        {peer.country_code && peer.country_code !== 'XX' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-[rgb(var(--color-text-muted))] font-mono">
                              {peer.country_code}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {(protocolType === 'ipv4' ? bgpData.ipv4Peers.length :
                      protocolType === 'ipv6' ? bgpData.ipv6Peers.length :
                      bgpData.allPeers.length) > 20 && (
                      <div className="text-center py-2">
                        <span className="text-sm text-[rgb(var(--color-text-muted))]">
                          Remaining: {(protocolType === 'ipv4' ? bgpData.ipv4Peers.length :
                                protocolType === 'ipv6' ? bgpData.ipv6Peers.length :
                                bgpData.allPeers.length) - 20} more nodes not shown...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 