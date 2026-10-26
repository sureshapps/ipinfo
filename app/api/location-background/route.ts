import { NextRequest, NextResponse } from "next/server";

interface CommonsImage {
  index?: number;
  imageinfo?: Array<{
    thumburl?: string;
    descriptionurl?: string;
    width: number;
    height: number;
    extmetadata?: Record<string, { value: string }>;
  }>;
}

const plainText = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim().slice(0, 180);
const safeURL = (value: string | undefined, hosts: string[]) => {
  try { const url = new URL(value || ""); return url.protocol === "https:" && hosts.includes(url.hostname) ? url.href : null; } catch { return null; }
};

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country")?.trim() || "";
  const city = request.nextUrl.searchParams.get("city")?.trim() || "";
  const region = request.nextUrl.searchParams.get("region")?.trim() || "";
  if (!country || [country, city, region].some(value => value.length > 100 || /[^\p{L}\p{N}\s.,()'-]/u.test(value))) {
    return NextResponse.json({ background: null }, { status: 400 });
  }
  const malaysia = country.toLowerCase() === "malaysia";
  const place = malaysia ? "Kuala Lumpur" : city || region || country;
  const searches = malaysia
    ? ["Kuala Lumpur skyline Petronas filetype:bitmap"]
    : [`${place} ${country} skyline filetype:bitmap`, `${region || country} landscape filetype:bitmap`];

  try {
    for (const [index, search] of searches.entries()) {
      const url = new URL("https://commons.wikimedia.org/w/api.php");
      url.search = new URLSearchParams({
        action: "query", format: "json", generator: "search",
        gsrsearch: search, gsrnamespace: "6", gsrlimit: "5",
        prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1920",
        iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl", iiextmetadatalanguage: "en",
      }).toString();
      const response = await fetch(url, {
        headers: { "User-Agent": "IPInfo/1.0 (https://github.com/sureshapps/ipinfo)" },
        signal: AbortSignal.timeout(7000), next: { revalidate: 86400 },
      });
      if (!response.ok) continue;
      const result = await response.json();
      const pages = Object.values(result.query?.pages || {}) as CommonsImage[];
      for (const page of pages.sort((a, b) => (a.index || 0) - (b.index || 0))) {
        const info = page.imageinfo?.[0];
        if (!info || info.width < 1200 || info.width / info.height < 1.3) continue;
        const image = safeURL(info.thumburl, ["thumb.wikimedia.org", "upload.wikimedia.org"]);
        const source = safeURL(info.descriptionurl, ["commons.wikimedia.org"]);
        const license = plainText(info.extmetadata?.LicenseShortName?.value || "");
        if (!image || !source || !/^(CC BY|CC0|Public domain)/i.test(license)) continue;
        return NextResponse.json({ background: {
          image, source, place: malaysia ? "Kuala Lumpur · KLCC, Malaysia" : [index === 0 ? place : region || country, country].filter((value, index, values) => values.indexOf(value) === index).join(", "),
          artist: plainText(info.extmetadata?.Artist?.value || "Wikimedia Commons contributor"),
          license, licenseURL: safeURL(info.extmetadata?.LicenseUrl?.value, ["creativecommons.org"]),
        } }, { headers: { "Cache-Control": "public, max-age=86400" } });
      }
    }
  } catch { /* Keep the gradient when the photo service is unavailable. */ }
  return NextResponse.json({ background: null }, { headers: { "Cache-Control": "public, max-age=300" } });
}
