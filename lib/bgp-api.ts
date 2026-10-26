// BGP API 数据类型定义
export interface BGPPeer {
  asn: number;
  name: string;
  description: string;
  country_code: string;
}

export interface BGPPeersResponse {
  status: string;
  status_message: string;
  data: {
    ipv4_peers: BGPPeer[];
    ipv6_peers: BGPPeer[];
  };
  "@meta": {
    time_zone: string;
    api_version: number;
    execution_time: string;
  };
}

export interface ProcessedBGPData {
  centerAsn: number;
  centerName: string;
  ipv4Peers: BGPPeer[];
  ipv6Peers: BGPPeer[];
  allPeers: BGPPeer[];
}

// BGP API 缓存
class BGPCache {
  private cache = new Map<
    number,
    { data: ProcessedBGPData; timestamp: number }
  >();
  private readonly TTL = 30 * 60 * 1000; // 30分钟缓存

  get(asn: number): ProcessedBGPData | null {
    const entry = this.cache.get(asn);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(asn);
      return null;
    }

    return entry.data;
  }

  set(asn: number, data: ProcessedBGPData): void {
    this.cache.set(asn, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const bgpCache = new BGPCache();

/**
 * 查询 ASN 的 BGP peers
 */
export async function fetchBGPPeers(asn: number): Promise<ProcessedBGPData> {
  // 检查缓存
  const cached = bgpCache.get(asn);
  if (cached) {
    return cached;
  }

  try {
    // 使用本地代理 API 端点
    const response = await fetch(`/api/bgp/${asn}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `BGP API Request failed: ${response.status} ${response.statusText}`
      );
    }

    const processedData: ProcessedBGPData = await response.json();

    // 缓存结果
    bgpCache.set(asn, processedData);

    return processedData;
  } catch (error) {
    console.error("BGP API Lookup failed:", error);
    throw new Error(
      error instanceof Error
        ? `BGP Lookup failed: ${error.message}`
        : "BGP Lookup failed: Unknown错误"
    );
  }
}

/**
 * 清除 BGP 缓存
 */
export function clearBGPCache(): void {
  bgpCache.clear();
}
