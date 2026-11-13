// SKH-TERRAIN-002: deterministic visual QA page for an authentic exported plant atlas.
// Does not create pixels, alter game simulation, or claim visual parity.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPlantAtlasPreview(manifest, imageUrl) {
  if (!manifest || !Array.isArray(manifest.bitmaps) || !manifest.bitmaps.length ||
      !Number.isSafeInteger(manifest.width) || manifest.width < 1 ||
      !Number.isSafeInteger(manifest.height) || manifest.height < 1 ||
      typeof imageUrl !== 'string' || !imageUrl || /[<>"']/.test(imageUrl))
    throw Error('invalid plant atlas preview inputs');
  for (const b of manifest.bitmaps) {
    if (![b.x,b.y,b.width,b.height].every(Number.isSafeInteger) ||
        b.x < 0 || b.y < 0 || b.width < 1 || b.height < 1 ||
        b.x+b.width > manifest.width || b.y+b.height > manifest.height)
      throw Error('plant bitmap outside atlas');
  }
  const rows = manifest.bitmaps.map(b => '<tr><td>'+escapeHtml(b.id)+'</td><td>'+escapeHtml(b.plant)+'</td><td>'+b.width+'×'+b.height+'</td><td>'+b.x+','+b.y+'</td><td>'+escapeHtml(b.offsetX)+','+escapeHtml(b.offsetY)+'</td></tr>').join('\n');
  const image = escapeHtml(imageUrl);
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>7KAA original plant atlas · QA 1×/2×</title>
<style>body{font:14px system-ui;background:#222;color:#eee;margin:24px}figure{display:inline-block;vertical-align:top;margin:12px}img{image-rendering:pixelated;max-width:none;background:repeating-conic-gradient(#777 0% 25%,#555 0% 50%) 0 0/16px 16px}table{border-collapse:collapse}td,th{border:1px solid #777;padding:5px} .scroller{overflow:auto;max-width:100%}</style>
<h1>7KAA original plant atlas — QA preview</h1><p>Source: ${escapeHtml(manifest.source)} · ${escapeHtml(manifest.sourceCommit)} · ${escapeHtml(manifest.license)}. Automated pixel-parity and Android checks: NOT RUN.</p>
<div class="scroller"><figure><figcaption>1× native</figcaption><img src="${image}" width="${manifest.width}" height="${manifest.height}" alt="original plant atlas at native scale"></figure><figure><figcaption>2× nearest-neighbor</figcaption><img src="${image}" width="${manifest.width*2}" height="${manifest.height*2}" alt="original plant atlas at double scale"></figure></div>
<h2>Bitmap records</h2><table><thead><tr><th>ID</th><th>Plant</th><th>Size</th><th>Atlas origin</th><th>Original offset</th></tr></thead><tbody>${rows}</tbody></table>
</html>`;
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const [,,manifestPath,imageUrl,outPath] = process.argv;
  if (!manifestPath || !imageUrl || !outPath) throw Error('usage: node plant-atlas-preview.mjs manifest.json image.png output.html');
  const html=renderPlantAtlasPreview(JSON.parse(readFileSync(manifestPath,'utf8')),imageUrl);
  mkdirSync(dirname(outPath),{recursive:true});
  writeFileSync(outPath,html);
}
