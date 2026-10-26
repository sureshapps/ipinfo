import { NextRequest, NextResponse } from "next/server";
interface Neighbour { asn: number; type: string; v4_peers: number; v6_peers: number }
export async function GET(_request: NextRequest, context: {params: Promise<{asn: string}>}) {
 const {asn} = await context.params;
 const number = Number(asn);
 if (!/^\d+$/.test(asn) || !Number.isSafeInteger(number) || number < 1 || number > 4294967295) return NextResponse.json({error: "Invalid ASN number."}, {status: 400});
 try {
  const response = await fetch("https://stat.ripe.net/data/asn-neighbours/data.json?resource=AS" + number + "&preferred_version=3.2", {signal: AbortSignal.timeout(12000), next: {revalidate: 1800}});
  if (!response.ok) throw new Error("BGP service is temporarily unavailable.");
  const result = await response.json();
  if (result.status !== "ok" || !Array.isArray(result.data?.neighbours)) throw new Error("Invalid BGP response.");
  const neighbours: Neighbour[] = result.data.neighbours;
  const peer = (n: Neighbour) => ({asn: n.asn, name: "AS" + n.asn, description: "Observed " + n.type + " neighbour (RIPE RIS)", country_code: ""});
  const ipv4Peers = neighbours.filter(n => n.v4_peers > 0).map(peer);
  const ipv6Peers = neighbours.filter(n => n.v6_peers > 0).map(peer);
  const allPeers = Array.from(new Map(neighbours.map(n => [n.asn, peer(n)])).values());
  return NextResponse.json({centerAsn: number, centerName: "AS" + number, ipv4Peers, ipv6Peers, allPeers}, {headers: {"Cache-Control": "public, max-age=1800"}});
 } catch { return NextResponse.json({error: "BGP service could not be reached. Please try again."}, {status: 502}); }
}
