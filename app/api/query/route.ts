import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import { getClientIP, checkPrivateIP } from "@/lib/ip-detection";
import type { IPInfo } from "@/lib/store";
export const runtime = "nodejs";
async function lookup(request: NextRequest, input?: unknown) {
  if (input !== undefined && typeof input !== "string") return NextResponse.json({error: "IP address must be a string."}, {status: 400});
  const explicit = typeof input === "string" ? input.trim() : "";
  if (explicit && (!isIP(explicit) || checkPrivateIP(explicit).isPrivate)) return NextResponse.json({error: "Enter a valid public IPv4 or IPv6 address."}, {status: 400});
  const client = getClientIP(request);
  const ip = explicit || (client && isIP(client) && !checkPrivateIP(client).isPrivate ? client : "");
  try {
    const response = await fetch("https://ipwho.is/" + encodeURIComponent(ip) + "?lang=en", {signal: AbortSignal.timeout(10000), next: {revalidate: 300}});
    if (!response.ok) return NextResponse.json({error: response.status === 429 ? "Lookup limit reached. Please try again later." : "Location service is temporarily unavailable."}, {status: response.status === 429 ? 429 : 502});
    const data = await response.json();
    if (!data.success || typeof data.ip !== "string" || !isIP(data.ip) || !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) return NextResponse.json({error: data.message || "No location found for this address."}, {status: 422});
    const result: IPInfo = {
      ip: data.ip, country: data.country, countryCode: data.country_code,
      province: data.region, provinceCode: data.region_code, city: data.city,
      regions: [data.country, data.region, data.city].filter(Boolean),
      isp: data.connection?.isp, as: {number: data.connection?.asn, name: data.connection?.org},
      location: {latitude: data.latitude, longitude: data.longitude},
      timezone: data.timezone?.id, postal: data.postal,
      accuracy: "medium", source: "IPWhois", ipVersion: isIP(data.ip) === 6 ? "IPv6" : "IPv4"
    };
    const key = process.env.GEOAPIFY_API_KEY;
    if (key) {
      try {
        const url = new URL("https://api.geoapify.com/v1/ipinfo");
        url.search = new URLSearchParams({ ip: result.ip, apiKey: key }).toString();
        const geoResponse = await fetch(url, { signal: AbortSignal.timeout(7000), next: { revalidate: 300 } });
        if (geoResponse.ok) {
          const geo = await geoResponse.json();
          if (geo.ip === result.ip && geo.country?.name && Number.isFinite(geo.location?.latitude) && Number.isFinite(geo.location?.longitude)) {
            result.country = geo.country.names?.en || geo.country.name;
            result.countryCode = geo.country.iso_code;
            result.city = geo.city?.names?.en || geo.city?.name;
            result.province = geo.state?.name;
            result.provinceCode = undefined;
            result.postal = geo.postal?.code;
            result.regions = [result.country, result.province, result.city].filter((value): value is string => Boolean(value));
            result.location = { latitude: geo.location.latitude, longitude: geo.location.longitude };
            result.source = "Geoapify";
          }
        }
      } catch { /* Retain the IPWhois location if Geoapify is unavailable. */ }
    }
    return NextResponse.json(result, {headers: {"Cache-Control": "private, no-store"}});
  } catch { return NextResponse.json({error: "Location service could not be reached. Please try again."}, {status: 502}); }
}
export async function GET(request: NextRequest) { return lookup(request, request.nextUrl.searchParams.get("ip") ?? undefined); }
export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({error: "Request body must be valid JSON."}, {status: 400}); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({error: "Request body must be an object."}, {status: 400});
  return lookup(request, body.ip);
}
