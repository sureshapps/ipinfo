'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ProcessedBGPData, BGPPeer } from '@/lib/bgp-api';
import { Globe, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import ReactCountryFlag from "react-country-flag";
import { toast } from "sonner";

interface NetworkNode {
  id: string;
  asn: number;
  name: string;
  description: string;
  countryCode: string;
  isCenter: boolean;
  tier: 'origin' | 'tier1' | 'tier2' | 'tier3';
  layer: number;
  x: number;
  y: number;
  color: string;
  flag: string;
  label?: string;
  protocolType: 'ipv4' | 'ipv6' | 'both';
}

interface NetworkLink {
  source: string;
  target: string;
  sourceNode: NetworkNode;
  targetNode: NetworkNode;
  protocolType: 'ipv4' | 'ipv6';
}

interface BGPNetworkChartProps {
  data: ProcessedBGPData;
  protocolType?: 'ipv4' | 'ipv6' | 'both';
  width?: number;
  height?: number;
  className?: string;
}

export default function BGPNetworkChart({ 
  data, 
  protocolType = 'both',
  width = 1000, 
  height = 600, 
  className = '' 
}: BGPNetworkChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);



  // 获取国旗emoji
  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      'US': '🇺🇸', 'JP': '🇯🇵', 'EE': '🇪🇪', 'AU': '🇦🇺',
      'SB': '🇸🇧', 'CA': '🇨🇦', 'CN': '🇨🇳', 'DE': '🇩🇪',
      'GB': '🇬🇧', 'FR': '🇫🇷', 'NL': '🇳🇱', 'SG': '🇸🇬',
      'KR': '🇰🇷', 'HK': '🇭🇰', 'IN': '🇮🇳', 'BR': '🇧🇷',
      'RU': '🇷🇺', 'IT': '🇮🇹', 'ES': '🇪🇸', 'SE': '🇸🇪',
      'NO': '🇳🇴', 'FI': '🇫🇮', 'DK': '🇩🇰', 'CH': '🇨🇭',
      'AT': '🇦🇹', 'BE': '🇧🇪', 'LU': '🇱🇺', 'IE': '🇮🇪'
    };
    return flagMap[countryCode] || '🌐';
  };

// ASNLevel分类常量 (基于公开的互联网基础设施数据，更新时间：2024年)
const TIER1_ASNS = useMemo(() => [174, 209, 286, 701, 1239, 1299, 2914, 3257, 3320, 3356, 3491, 5511, 6453, 6461, 6830, 7018, 12956], []);
const TIER2_ASNS = useMemo(() => [2497, 6939, 9370, 17676, 25820, 59105, 137409, 215871], []);

  // 获取ASNLevel
  const getASNTier = useCallback((asn: number) => {
    if (TIER1_ASNS.includes(asn)) return { tier: 'tier1' as const, label: 'Tier 1 ISP', color: '#3b82f6' };
    if (TIER2_ASNS.includes(asn)) return { tier: 'tier2' as const, label: 'Tier 2 ISP', color: '#f97316' };
    return { tier: 'tier3' as const, label: 'Regional ISP', color: '#8b5cf6' };
  }, [TIER1_ASNS, TIER2_ASNS]);

  // 处理数据并创建层次结构
  const processData = useCallback(() => {
    if (!data) return { nodes: [], links: [] };

    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // 根据Protocol筛选对等节点
    let selectedPeers: BGPPeer[] = [];
    if (protocolType === 'ipv4') {
      selectedPeers = data.ipv4Peers;
    } else if (protocolType === 'ipv6') {
      selectedPeers = data.ipv6Peers;
    } else {
      // 合并IPv4和IPv6数据，但保持Protocol信息
      const allPeers = new Map<number, BGPPeer>();
      data.ipv4Peers.forEach(peer => allPeers.set(peer.asn, peer));
      data.ipv6Peers.forEach(peer => allPeers.set(peer.asn, peer));
      selectedPeers = Array.from(allPeers.values());
    }

    // 中心节点
    const centerNode: NetworkNode = {
      id: `as${data.centerAsn}`,
      asn: data.centerAsn,
      name: data.centerName || 'Target ASN',
      description: 'Target ASN',
      countryCode: '',
      isCenter: true,
      tier: 'origin',
      layer: 0,
      x: 150,
      y: height / 2,
      color: '#22c55e',
      flag: '🎯',
      label: 'Origin',
      protocolType: 'both'
    };
    nodes.push(centerNode);

    // 按Level分组
    const tier1Peers = selectedPeers.filter(p => getASNTier(p.asn).tier === 'tier1');
    const tier2Peers = selectedPeers.filter(p => getASNTier(p.asn).tier === 'tier2');


    // 添加Level节点
    const addNodesForTier = (tierPeers: BGPPeer[], layer: number, startX: number) => {
      tierPeers.forEach((peer, index) => {
        const tierInfo = getASNTier(peer.asn);
        
        // 确定节点的Protocol
        const hasIPv4 = data.ipv4Peers.some(p => p.asn === peer.asn);
        const hasIPv6 = data.ipv6Peers.some(p => p.asn === peer.asn);
        const nodeProtocolType = hasIPv4 && hasIPv6 ? 'both' : hasIPv6 ? 'ipv6' : 'ipv4';
        
        const node: NetworkNode = {
          id: `as${peer.asn}`,
          asn: peer.asn,
          name: peer.name,
          description: peer.description,
          countryCode: peer.country_code,
          isCenter: false,
          tier: tierInfo.tier,
          layer,
          x: startX,
          y: 100 + (index * 80) + (Math.random() - 0.5) * 20,
          color: tierInfo.color,
          flag: peer.country_code,
          label: tierInfo.label,
          protocolType: nodeProtocolType
        };
        nodes.push(node);

        // 创建到中心节点的连接
        if (protocolType === 'both') {
          // 在混合 mode下，为IPv4和IPv6分别创建连接
          if (hasIPv4) {
            links.push({
              source: centerNode.id,
              target: node.id,
              sourceNode: centerNode,
              targetNode: node,
              protocolType: 'ipv4'
            });
          }
          if (hasIPv6) {
            links.push({
              source: centerNode.id,
              target: node.id,
              sourceNode: centerNode,
              targetNode: node,
              protocolType: 'ipv6'
            });
          }
        } else {
          // 在单一Protocol mode下，只创建一种连接
          links.push({
            source: centerNode.id,
            target: node.id,
            sourceNode: centerNode,
            targetNode: node,
            protocolType: protocolType
          });
        }
      });
    };

    if (tier1Peers.length > 0) addNodesForTier(tier1Peers, 1, 400);
    if (tier2Peers.length > 0) addNodesForTier(tier2Peers, 2, 650);

    return { nodes, links };
  }, [data, protocolType, height, getASNTier]);

  // 绘制图表
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { nodes, links } = processData();

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        setTransform(event.transform);
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // 主要绘图组
    const g = svg.append("g");

    // 创建背景区域
    const backgroundAreas = [
      { x: 50, width: 150, label: 'Origins', color: '#22c55e' },
      { x: 300, width: 150, label: 'Tier 1 ISPs', color: '#3b82f6' },
      { x: 550, width: 150, label: 'Tier 2 ISPs', color: '#f97316' }
      // 移除区域ISPs区域以简化显示
    ];

    backgroundAreas.forEach(area => {
      g.append("rect")
        .attr("x", area.x)
        .attr("y", 50)
        .attr("width", area.width)
        .attr("height", height - 100)
        .attr("fill", area.color)
        .attr("fill-opacity", 0.1)
        .attr("stroke", area.color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("rx", 8);

      g.append("text")
        .attr("x", area.x + area.width / 2)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .attr("fill", area.color)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(area.label);
    });

    // 添加箭头标记 - IPv4
    const defs = g.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead-ipv4")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#3b82f6");

    // 添加箭头标记 - IPv6
    defs.append("marker")
      .attr("id", "arrowhead-ipv6")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#8b5cf6");

    // 绘制连接线
    g.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", d => d.sourceNode.x + 60)
      .attr("y1", d => d.sourceNode.y + 25)
      .attr("x2", d => d.targetNode.x)
      .attr("y2", d => d.targetNode.y + 25)
      .attr("stroke", d => d.protocolType === 'ipv4' ? "#3b82f6" : "#8b5cf6")
      .attr("stroke-width", d => d.protocolType === 'ipv4' ? 2 : 1.5)
      .attr("stroke-dasharray", d => d.protocolType === 'ipv4' ? "none" : "5,5")
      .attr("marker-end", d => d.protocolType === 'ipv4' ? "url(#arrowhead-ipv4)" : "url(#arrowhead-ipv6)");

    // 绘制节点
    const nodeGroups = g.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
      });

    // 节点矩形
    nodeGroups.append("rect")
      .attr("width", d => d.isCenter ? 120 : 100)
      .attr("height", d => d.isCenter ? 50 : 40)
      .attr("rx", 6)
      .attr("fill", d => d.color)
      .attr("stroke", "rgb(var(--color-surface))")
      .attr("stroke-width", 3);

    // ASN文本
    nodeGroups.append("text")
      .attr("x", d => d.isCenter ? 60 : 50)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(d => `AS${d.asn}`);

    // Name文本
    nodeGroups.append("text")
      .attr("x", d => d.isCenter ? 60 : 50)
      .attr("y", 32)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name);

    // Country标识 - 直接使用SVG text显示emoji国旗
    nodeGroups.filter((d: NetworkNode) => !d.isCenter && Boolean(d.countryCode) && d.countryCode !== 'XX')
      .append("text")
      .attr("x", 85)
      .attr("y", 20)
      .attr("font-size", "14px")
      .attr("text-anchor", "middle")
      .style("filter", "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))")
      .text(d => {
        const flag = getCountryFlag(d.countryCode);
        // 如果emoji国旗不可用，显示Country code
        return flag !== '🌐' ? flag : d.countryCode;
      });

    // 添加工具提示
    const tooltip = d3.select('body').append('div')
      .attr('class', 'bgp-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgb(var(--color-surface))')
      .style('color', 'rgb(var(--color-text-primary))')
      .style('border', '1px solid rgb(var(--color-border))')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    nodeGroups
      .on('mouseover', (event, d) => {
        tooltip
          .style('visibility', 'visible')
          .html(
            `<div><strong>AS${d.asn}</strong></div>` +
            `<div>${d.name}</div>` +
            `<div>${d.description}</div>` +
            (d.countryCode ? `<div>Country: ${d.countryCode}</div>` : '') +
            `<div>Level: ${d.label || 'Origin'}</div>` +
            `<div>Protocol: ${d.protocolType === 'both' ? 'IPv4/IPv6' : d.protocolType}</div>`
          );
      })
      .on('mousemove', (event) => {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

    // 时间戳
    g.append("text")
      .attr("x", 20)
      .attr("y", height - 20)
      .attr("fill", "#6b7280")
      .attr("font-size", "12px")
      .text(new Date().toLocaleString('en-US', {
        year: '2-digit',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      }) + ' UTC');

         // 应用当前变换
     g.attr("transform", transform.toString());

    // 清理函数
    return () => {
      d3.select('body').selectAll('.bgp-tooltip').remove();
    };

  }, [data, protocolType, transform, processData, height]);

  // 控制函数
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current!);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.2
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current!);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.8
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current!);
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform,
      d3.zoomIdentity
    );
  };

  const handleExport = () => {
    try {
      const svgElement = svgRef.current;
      if (!svgElement) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // 使用2倍尺寸确保内容完整显示
      const exportWidth = width * 2;
      const exportHeight = height * 2;
      
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      
      // 设置高质量图像
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      
      img.onload = () => {
        ctx!.drawImage(img, 0, 0, exportWidth, exportHeight);
        const link = document.createElement('a');
        link.download = `asn-${data.centerAsn}-topology.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      };
      
      img.onerror = () => {
        toast.error("Image generation failed", {
          description: "Please try again later",
          duration: 3000,
        });
      };
      
      // Unicode 字符编码处理
      const encodedSvg = btoa(unescape(encodeURIComponent(svgData)));
      img.src = 'data:image/svg+xml;base64,' + encodedSvg;
      
    } catch {
      toast.error("Export failed", {
        description: "Please try again later",
        duration: 3000,
      });
    }
  };

  // 统计信息
  const { nodes } = processData();
  const tier1Count = nodes.filter(n => n.tier === 'tier1').length;
  const tier2Count = nodes.filter(n => n.tier === 'tier2').length;

  return (
    <div className={`w-full ${className}`}>
      {/* SVG容器 */}
      <div className="relative w-full overflow-hidden border border-[rgb(var(--color-border))] rounded-lg bg-[rgb(var(--color-surface))] transition-colors duration-300">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ background: 'rgb(var(--color-surface))' }}
        />

        {/* 控制按钮 */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-[rgb(var(--color-surface))]/90 backdrop-blur-sm border border-[rgb(var(--color-border))] rounded-md hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200 flex items-center justify-center"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-[rgb(var(--color-surface))]/90 backdrop-blur-sm border border-[rgb(var(--color-border))] rounded-md hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200 flex items-center justify-center"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="w-10 h-10 bg-[rgb(var(--color-surface))]/90 backdrop-blur-sm border border-[rgb(var(--color-border))] rounded-md hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200 flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExport}
            className="w-10 h-10 bg-[rgb(var(--color-surface))]/90 backdrop-blur-sm border border-[rgb(var(--color-border))] rounded-md hover:bg-[rgb(var(--color-surface-hover))] transition-colors duration-200 flex items-center justify-center"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* 图例 */}
        <div className="absolute bottom-4 left-4 bg-[rgb(var(--color-surface))]/95 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-[rgb(var(--color-border))] max-w-xs">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-1 text-[rgb(var(--color-text-primary))]">
            <Globe className="h-4 w-4" />
            Node types
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-green-500"></div>
              <span className="text-[rgb(var(--color-text-secondary))]">Origins (Origin AS)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-blue-500"></div>
              <span className="text-[rgb(var(--color-text-secondary))]">Tier 1 ISPs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-orange-500"></div>
              <span className="text-[rgb(var(--color-text-secondary))]">Tier 2 ISPs</span>
            </div>
          </div>
          
          {/* Protocol图例 */}
          {protocolType === 'both' && (
            <>
              <div className="mt-3 pt-2 border-t border-[rgb(var(--color-border))]">
                <h5 className="font-medium text-xs mb-2 text-[rgb(var(--color-text-primary))]">Connection types</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500"></div>
                    <span className="text-[rgb(var(--color-text-secondary))]">IPv4 connection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-purple-500" style={{ borderTop: '2px dashed #8b5cf6' }}></div>
                    <span className="text-[rgb(var(--color-text-secondary))]">IPv6 connection</span>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t text-xs text-[rgb(var(--color-text-muted))]">
            Click a node for details<br/>
            Scroll to zoom and drag to pan
          </div>
        </div>
      </div>

      {/* Selected node信息面板 */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900">
              Selected node: AS{selectedNode.asn} {selectedNode.flag}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="h-6 w-6 text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              ✕
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {selectedNode.name}</div>
            <div><strong>Description:</strong> {selectedNode.description}</div>
            <div><strong>Country:</strong> 
              {selectedNode.countryCode && selectedNode.countryCode !== 'XX' ? (
                <ReactCountryFlag 
                  countryCode={selectedNode.countryCode} 
                  svg 
                  style={{ width: '1em', height: '1em', marginLeft: '0.25rem' }} 
                />
              ) : '🌐'} {selectedNode.countryCode}
            </div>
            <div><strong>Level:</strong> {selectedNode.label || 'Origin'}</div>
            <div><strong>Protocol:</strong> {selectedNode.protocolType === 'both' ? 'IPv4/IPv6' : selectedNode.protocolType}</div>
          </div>
        </div>
      )}

             {/* 统计信息 */}
       <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-[rgb(var(--color-text-secondary))]">Tier 1 ISPs</span>
          </div>
          <div className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mt-1">
            {tier1Count}
          </div>
          <p className="text-xs text-[rgb(var(--color-text-muted))]">Large international providers</p>
        </div>
        
        <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-sm text-[rgb(var(--color-text-secondary))]">Tier 2 ISPs</span>
          </div>
          <div className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mt-1">
            {tier2Count}
          </div>
          <p className="text-xs text-[rgb(var(--color-text-muted))]">Large regional ISPs</p>
        </div>
        
                 {/* 移除区域ISPs统计卡片 */}
        
        <div className="bg-[rgb(var(--color-surface))] rounded-lg p-4 border border-[rgb(var(--color-border))] transition-colors duration-300">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-green-500" />
            <span className="text-sm text-[rgb(var(--color-text-secondary))]">Coverage</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(new Set(nodes.map(n => n.flag))).slice(0, 6).map((flag, i) => (
              <span key={i} className="text-lg">{flag}</span>
            ))}
          </div>
          <p className="text-xs text-[rgb(var(--color-text-muted))]">Multiple regions worldwide</p>
        </div>
      </div>
    </div>
  );
} 
