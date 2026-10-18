// Converts US Census NJ county GeoJSON into compact SVG path data for the site map.
// Usage: node to-svg.mjs <input.geojson> <output.ts>
import fs from 'node:fs';

const [, , input, output] = process.argv;
const geo = JSON.parse(fs.readFileSync(input, 'utf8'));

const W = 420;
const PAD = 6;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
const allRings = [];
for (const f of geo.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) for (const ring of p) allRings.push(ring);
}
const meanLat = allRings.flat().reduce((s, [, lat]) => s + lat, 0) / allRings.flat().length;
const k = Math.cos((meanLat * Math.PI) / 180);
for (const ring of allRings) for (const [lon, lat] of ring) {
  const x = lon * k, y = -lat;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const scale = (W - PAD * 2) / (maxX - minX);
const H = Math.ceil((maxY - minY) * scale + PAD * 2);
const px = ([lon, lat]) => [+(((lon * k) - minX) * scale + PAD).toFixed(1), +(((-lat) - minY) * scale + PAD).toFixed(1)];

const counties = geo.features.map((f) => {
  const name = f.properties.NAME.replace(/ County$/, '');
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = '';
  let area = 0, bestCx = 0, bestCy = 0;
  for (const p of polys) {
    const outer = p[0].map(px);
    // centroid of the largest ring, for the label dot
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < outer.length - 1; i++) {
      const [x0, y0] = outer[i], [x1, y1] = outer[i + 1];
      const c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
    }
    a /= 2;
    if (Math.abs(a) > Math.abs(area)) { area = a; bestCx = cx / (6 * a); bestCy = cy / (6 * a); }
    for (const ring of p) {
      const pts = ring.map(px).filter((pt, i, arr) => i === 0 || pt[0] !== arr[i - 1][0] || pt[1] !== arr[i - 1][1]);
      d += 'M' + pts.map(([x, y]) => `${x} ${y}`).join('L') + 'Z';
    }
  }
  return { name, slug: name.toLowerCase().replace(/\s+/g, '-'), d, cx: +bestCx.toFixed(1), cy: +bestCy.toFixed(1) };
}).sort((a, b) => a.name.localeCompare(b.name));

const ts = `// New Jersey's 21 counties as SVG paths, generated from US Census Bureau TIGERweb
// county boundaries (generalized). Regenerate with scripts/to-svg.mjs; do not hand-edit.
import type { CountySlug } from '@/lib/slugs';

export const NJ_VIEWBOX = '0 0 ${W} ${H}';

export type CountyShape = { name: string; slug: CountySlug; d: string; cx: number; cy: number };

export const NJ_COUNTIES: CountyShape[] = ${JSON.stringify(counties, null, 1)};
`;
fs.writeFileSync(output, ts);
console.log(`wrote ${counties.length} counties, viewBox 0 0 ${W} ${H}, ${(ts.length / 1024).toFixed(1)} KB`);
