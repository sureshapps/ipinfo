import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await context.params;
  const zoom = Number(z), column = Number(x), row = Number(y);
  if (![z, x, y].every(value => /^\d+$/.test(value)) || zoom > 20 || column >= 2 ** zoom || row >= 2 ** zoom) {
    return NextResponse.json({ error: "Invalid map tile coordinates." }, { status: 400 });
  }
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return NextResponse.json({ error: "Map service is not configured." }, { status: 503 });
  const style = request.nextUrl.searchParams.get("theme") === "dark" ? "dark-matter" : "positron";
  try {
    const url = new URL(`https://maps.geoapify.com/v1/tile/${style}/${zoom}/${column}/${row}.png`);
    url.searchParams.set("apiKey", key);
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });
    if (!response.ok || !response.headers.get("content-type")?.includes("image/png")) {
      return NextResponse.json({ error: "Map tiles are temporarily unavailable." }, { status: response.status === 429 ? 429 : 502 });
    }
    return new NextResponse(await response.arrayBuffer(), { headers: {
      "Content-Type": "image/png", "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff",
    } });
  } catch { return NextResponse.json({ error: "Map service could not be reached." }, { status: 502 }); }
}
