# IPInfo

An English-language IPv4 and IPv6 lookup site built with Next.js, React, TypeScript, Tailwind CSS, and Leaflet.

## Run locally

Install Node.js 22 or newer, then run:

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Search for a public IP address, select an example, or use **Look up my IP**.

Set `GEOAPIFY_API_KEY` in `.env.local` before starting. The key is read only by server routes and is never included in browser URLs or committed source. On Windows, copy the example file with `Copy-Item .env.example .env.local`.

## Production

```sh
npm run build
npm start
```

For Docker, run `docker compose --env-file .env.local up --build -d`. Set the same environment variable in your hosting provider when deploying.

## APIs

- **Location and map tiles:** https://apidocs.geoapify.com/docs/ip-geolocation/ and https://apidocs.geoapify.com/docs/maps/map-tiles/ — Geoapify supplies English location data, coordinates, and light/dark map tiles. The server proxies tile requests to keep the API key private. Required Geoapify, OpenStreetMap, and OpenMapTiles attribution is displayed on the map.
- **Network details and fallback:** https://ipwhois.io/documentation — supplies ISP, ASN, time zone, and fallback location data if Geoapify is unavailable. No database download is needed. Review provider quotas before deploying at scale.
- **BGP neighbours:** https://stat.ripe.net/docs/data-api/api-endpoints/asn-neighbours — observed IPv4 and IPv6 neighbours from RIPE RIS. Neighbours are labeled by ASN because this endpoint does not supply organization names or country codes.
- **Location backgrounds:** Wikimedia Commons skyline and landscape photos, matched to the lookup city or region with a country fallback. Malaysia uses Kuala Lumpur and the Petronas Towers (KLCC). Photo and license credits appear at the bottom of the page. If no suitable photo is available, the gradient remains.

Requests run through the site's own API routes with timeouts and upstream caching. Visitor-specific lookup responses are never publicly cached.

### Routes

- `GET /api/query?ip=8.8.8.8`
- `POST /api/query` with JSON `{"ip":"8.8.8.8"}`
- `GET /api/query` or an empty POST object detects the request IP. On localhost, this resolves the server connection's public IP. On a remote server without forwarded client headers, this also resolves the server IP. Configure a trusted reverse proxy to supply the visitor IP.
- `GET /api/bgp/15169`

Malformed input and non-public addresses return English validation errors. Provider failures return a retryable error. IP geolocation is approximate and does not identify a street address or a person's physical location.

The previous optional MMDB and Meituan modules remain in the source for compatibility; the default interface uses the APIs above and does not initialize database downloads or expose legacy trace and proxy checks. Missing or invalid Geoapify configuration leaves IP lookup available through the fallback provider, but map tiles require a valid Geoapify key.

## Checks

```sh
npx tsc --noEmit
npm run lint
npm run build
```

With the server running, use `npm run test:smoke` to check live lookups and validation.
