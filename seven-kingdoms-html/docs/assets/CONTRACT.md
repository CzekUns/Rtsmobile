# SKH-101 Asset Engineer — decoder contract (experimental)

Issue: https://github.com/CzekUns/Rtsmobile/issues/7  
Branch: `agent/skh-assets/decoder`  
Scope: `seven-kingdoms-html/{tools/assets,assets/manifests,assets/previews,tests/assets,docs/assets}/`

## Entry point

```sh
node seven-kingdoms-html/tools/assets/decode.mjs --source /path/to/unpacked/7kaa --out /tmp/7kaa-assets
node --test seven-kingdoms-html/tests/assets/*.test.mjs
```

Input to `decode.mjs` must be an unpacked, locally authorized original resource directory. For compressed Emscripten `.js/.data` packages first run `emscripten-lz4.mjs` as described in [EMSCRIPTEN_PACKAGE.md](./EMSCRIPTEN_PACKAGE.md); this extracts virtual files before passing them to `decode.mjs`. The metadata decoder also reads embedded `SPRITE`, `SACTION`, `SFRAME` tables directly from `RESOURCE/STD.SET` when present. The output `pack.json` is deterministic given identical file bytes. The CLI reads indexed `.RES` and packed `SPRITE.DBF`, `SACTION.DBF`, `SFRAME.DBF` when supplied, or the same tables embedded in `STD.SET`. It does **not** unpack Emscripten bundles, decode compressed bitmap pixels, apply game palettes, generate PNG, or render town atlases. Do not treat this as a finished pixel converter.

Exports: `parseRes(buffer)`, `parseDbf(buffer)`, `decodeTable(type,buffer)`, `makeManifest(input)`, `run(source,out)`, `sha256(buffer)`. All throw on structural invalidity. No browser dependencies. The output's `sprites[]` records include `id,action,direction,frame,width,height,pivotX,pivotY,palette,path` plus original frame index, source bitmap file and byte offset. `path=null`, `palette=null`, `decoded=false` mean pixels **not verified**. `pivotX/pivotY=-offset` represent the local sprite coordinate origin; a ground-contact anchor is not yet validated. No compass direction mapping is guessed.

## Original source layouts

- `ORESX.cpp` + `ORESX.h`: `ResourceIdx` little-endian count (u16), 13-byte packed index (9-byte name + u32 absolute pointer), including sentinel entry; byte length = next pointer minus current.
- `ODB.cpp` + `ODB.h`: packed 12-byte DBF header, original parser adds one marker byte before `data_offset`; record numbering begins at 1.
- `OSPRTRES.cpp` + `OSPRTRES.h`: 1-based `SPRITE` → `SACTION` entries (M, A1–A9, S, D, G/GM); directional `dir_id` is numeric and source-defined; movement's first frame is default stop when S missing.
- `OSFRMRES.cpp` + `OSFRMRES.h`: signed text offsets, dimensions, binary u32 bitmap offset.
- `ORESDB.cpp`: `read_imported` skips the 4-byte record length before bitmap data. **Bitmap compression and native palette remapping remain unimplemented.**

Source code: https://github.com/the3dfxdude/7kaa (GPL-2.0-or-later headers). Emscripten resources catalogued from https://github.com/CzekUns/sevenkindomsmobile/tree/main/data.

## Actual artifacts and limits

**Unit converted:** 0. **Town converted:** 0. **Original PNG atlases verified:** 0. **Pixel-level visual comparisons:** 0.\n\n**SKH-107 second cycle:** `tools/assets/emscripten-lz4.mjs` implements genuine LZ4 package byte extraction with JSON-only metadata parsing, block bounds validation and SHA-256 logs; `decode.mjs` now supports `STD.SET` metadata. Checked upstream Emscripten metadata: `SPRITE.js` has 97 virtual files and `RESOURCE.js` has 110, including `STD.SET` and `I_TOWN.RES`. CI tests pass on synthetic fixtures. **No real binary `.data` was available to execute and byte-compare in this session.** Do not call it a visually validated asset conversion.

The source repository lists `SPRITE.data` (6,281,403 bytes), `RESOURCE.data` (22,135,228 bytes), `IMAGE.data` (7,094,759 bytes), and other Emscripten bundles. Companion `.js` files describe mounting. Their existence does not mean extracted `.SPR` and DBF data have been opened. Their graphics rights must be separately verified before redistribution: the upstream GPL source license alone is **not** evidence that every commercial game graphic, music track or font is GPL. Do not commit large packs or republish converted art before permission/provenance review.

Required next work: execute extraction on legally sourced original binaries and compare extracted SHA bytes; implement and validate bitmap compression + palette/transparency/remap; identify original town resource structures; produce unit/town PNG atlas with image-based A/B verification at 1×/2× and 8 directions, count declared vs distinct animation frames. G1 is **BLOCKED**, not passed.

## Handoff to integration

No `view.js` integration yet. Consumers must reject any frame whose `decoded !== true` or `path === null`. Do not infer that numeric `direction` equals the viewport-facing direction. The catalog is tooling-only; no asset is ready for shipping.

Tests: synthetic structural fixtures for RES, DBF, SFRAME, manifest fail-closed and checksums. The full project test command `npm --prefix seven-kingdoms-html test` remains mandatory in CI; no claim of a successful run is made without actual execution.


## Second-cycle handoff (issue #19)

- PR: https://github.com/CzekUns/Rtsmobile/pull/13 (draft).
- New exports: `packageMetadata(js)`, `decodeLz4Block(source,expected)`, `unpackData(data,meta,{paths?})`, `extractPackage(jsPath,dataPath,out,{select?})` in `tools/assets/emscripten-lz4.mjs`.
- `decode.mjs` input: extracted directory (including nested `data/RESOURCE/STD.SET`), output `pack.json`, status `metadata-only` (or `inventory-only`).
- Tests: `node --test` via GitHub Actions; run logs attached to PR.
- Integration dependency: no runtime adapter until actual image pixels, accurate palette/transparency and original town render have been verified.
- No fabricated atlas or inferred unit/town original frame; licence of bundled artwork awaiting review.

## Handoff: original indexed pixel decoder and building pipeline (2026-11-05)

**Branch / PR:** `agent/skh-assets/decoder`, [PR #13](https://github.com/CzekUns/Rtsmobile/pull/13), #7/#19/#44. Full evidence and upstream commit: [ORIGINAL_PIXEL_AUDIT.md](./ORIGINAL_PIXEL_AUDIT.md).

New exports (all Node.js, zero WebAssembly):

- `tools/assets/pixel-codec.mjs`: `decodeImportedBitmap(buffer,offset)` accepts a `ResourceDb` source record with a preceding u32 length and returns precise indexed pixels, dimensions and opacity statistics. `decodeStandardPalette(buffer)`, `indexedToRgba(bitmap,palette,{mirror,remap})`, `nationRemapTable(schemeId,{selected})`, `mirrorForDirection(direction,turnResolution)`, `encodePng(width,height,rgba)`.
- `tools/assets/render-unit.mjs`: `renderUnit(sourceRoot,outputRoot,unitCode)` generates `frames/*.png`, `unit.json`, plus original NORMAN movement contact sheets 1×/2× where supported. Manifest includes original action/direction/frame and SFRAME reference, original bitmap record offset, pixel hash and duplicate frames, source SHA-256, palette, mirror, original offsets, local image-origin pivot, license, `visuallyVerified:false`.
- `tools/assets/render-firm.mjs`: `parseFirmTables(stdSet)`, `selectedBuild(tables,firmCode,raceCode)`, `renderFirm(sourceRoot,outputRoot,{firmCode,raceCode,colorSchemeId})`. Generates separate PNG files for every relevant FBITMAP, construction phases, idle and active with original nation shade remapping and ground layer, plus `firm.json`.

**Inputs:** a checked-out GPL 7kaa upstream `data/RESOURCE/STD.SET`, `PAL_STD.RES`, source unit `SPRITE/*.SPR` or building `RESOURCE/I_FIRM.RES`; source root may point to the upstream repository or `data/`. **Outputs:** local files written only to the caller-specified output directory. The preview PNGs checked into `assets/previews` document verified *byte-decode* examples, not finished game integration.

**Statuses must not be conflated:** legacy `decode.mjs` `pack.json` remains `metadata-only`/`decoded:false`; generated `unit.json`/`firm.json` become `decoded:true` only after PNG bytes are produced; they retain `visuallyVerified:false` and `integrated:false` until independent side-by-side screenshots and renderer tests. The sample test fixtures contain verbatim original pixel records pinned to upstream sources, not synthetic art.

**Integration boundary:** maintain existing full-screen board, adaptive mobile HUD, multi-select, group movement, and COMANDI/joystick/MOD. No renderer or shared file modification in this PR. The separate integration branch should consume only verified manifest records, key animations on actual unit movement state, draw with nearest-neighbour pixel scaling, apply nation color only to original indices, respect ground layer 4 and fail back for missing assets. A renderer PR is blocked pending original screenshot parity; do not merge PR #13 automatically.

**Command:** `npm --prefix seven-kingdoms-html test`. Real source end-to-end tests: `SKH_7KAA_SOURCE=/path/to/7kaa node --test seven-kingdoms-html/tests/assets/*.test.mjs`. See [audit](./ORIGINAL_PIXEL_AUDIT.md) for direct conversion commands and outstanding visual gates.
