import assert from 'node:assert/strict';
const base = 'http://localhost:3000';
async function query(body, status = 200) {
 const r = await fetch(base + '/api/query', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d = await r.json(); assert.equal(r.status,status,JSON.stringify(d));
 assert.match(r.headers.get('cache-control') || '',/private/);
 return d;
}
const v4 = await query({ip:'8.8.8.8'}); assert.equal(v4.ip,'8.8.8.8'); assert.equal(v4.country,'United States'); assert.equal(v4.as.number,15169); console.log('PASS IPv4 location and ASN');
const v6 = await query({ip:'2001:4860:4860::8888'}); assert.equal(v6.ipVersion,'IPv6'); console.log('PASS IPv6 lookup');
const own = await query({}); assert.ok(own.ip); console.log('PASS automatic public IP lookup');
for(const ip of ['invalid','127.0.0.1','192.168.1.1','::1',42]) await query({ip},400);
console.log('PASS invalid and private IP rejection');
const malformed = await fetch(base + '/api/query',{method:'POST',body:'{'}); assert.equal(malformed.status,400);
const bgp = await fetch(base + '/api/bgp/15169'); const peers = await bgp.json(); assert.equal(bgp.status,200,JSON.stringify(peers)); assert.ok(peers.allPeers.length); console.log('PASS live BGP neighbours');
const badASN = await fetch(base + '/api/bgp/15169junk'); assert.equal(badASN.status,400); console.log('PASS strict ASN validation');
const page = await fetch(base); const html = await page.text(); assert.equal(page.status,200); assert.match(html,/<html lang="en"/); console.log('PASS English homepage');
const backdrop = await fetch(base + '/api/location-background?country=Malaysia&city=Petaling&region=Selangor');
const photo = await backdrop.json(); assert.equal(backdrop.status,200); assert.match(photo.background?.place || '',/Kuala Lumpur/); assert.match(photo.background.image,/wikimedia\.org/); assert.ok(photo.background.artist); console.log('PASS Malaysia KLCC background and credits');
const invalidLocation = await fetch(base + '/api/location-background?country=%3Cscript%3E'); assert.equal(invalidLocation.status,400); console.log('PASS background input validation');
assert.equal(v4.source,'Geoapify'); assert.equal(v4.city,'Mountain View'); console.log('PASS Geoapify location integration');
for (const theme of ['light','dark']) {
 const tile = await fetch(base + '/api/map-tiles/1/1/1?theme=' + theme);
 assert.equal(tile.status,200); assert.match(tile.headers.get('content-type'),/image\/png/);
 const bytes = new Uint8Array(await tile.arrayBuffer()); assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
 console.log('PASS Geoapify ' + theme + ' map tiles');
}
const invalidTile = await fetch(base + '/api/map-tiles/1/99/1'); assert.equal(invalidTile.status,400); console.log('PASS map tile validation');
