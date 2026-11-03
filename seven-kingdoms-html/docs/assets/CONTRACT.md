# SKH-101 Asset Engineer — decoder contract (experimental)

Issue: https://github.com/CzekUns/Rtsmobile/issues/7  
Branch: `agent/skh-assets/decoder`  
Scope: `seven-kingdoms-html/{tools/assets,assets/manifests,assets/previews,tests/assets,docs/assets}/`

## Entry point

```sh
node seven-kingdoms-html/tools/assets/decode.mjs --source /path/to/unpacked/7kaa --out /tmp/7kaa-assets
node --test seven-kingdoms-html/tests/assets/*.test.mjs
```

Input must be an **unpacked, locally authorized original resource directory**, not Emscripten `.data` files. The output `pack.json` is deterministic given identical file bytes. The CLI reads indexed `.RES` and packed `SPRITE.DBF`, `SACTION.DBF`, `SFRAME.DBF` when supplied. It does **not** unpack Emscripten bundles, decode compressed bitmap pixels, apply game palettes, generate PNG, or render town atlases. Do not treat this as a finished pixel converter.

Exports: `parseRes(buffer)`, `parseDbf(buffer)`, `decodeTable(type,buffer)`, `makeManifest(input)`, `run(source,out)`, `sha256(buffer)`. All throw on structural invalidity. No browser dependencies. The output's `sprites[]` records include `id,action,direction,frame,width,height,pivotX,pivotY,palette,path` plus original frame index, source bitmap file and byte offset. `path=null`, `palette=null`, `decoded=false` mean pixels **not verified**. `pivotX/pivotY=-offset` represent the local sprite coordinate origin; a ground-contact anchor is not yet validated. No compass direction mapping is guessed.

## Original source layouts

- `ORESX.cpp` + `ORESX.h`: `ResourceIdx` little-endian count (u16), 13-byte packed index (9-byte name + u32 absolute pointer), including sentinel entry; byte length = next pointer minus current.
- `ODB.cpp` + `ODB.h`: packed 12-byte DBF header, original parser adds one marker byte before `data_offset`; record numbering begins at 1.
- `OSPRTRES.cpp` + `OSPRTRES.h`: 1-based `SPRITE` → `SACTION` entries (M, A1–A9, S, D, G/GM); directional `dir_id` is numeric and source-defined; movement's first frame is default stop when S missing.
- `OSFRMRES.cpp` + `OSFRMRES.h`: signed text offsets, dimensions, binary u32 bitmap offset.
- `ORESDB.cpp`: `read_imported` skips the 4-byte record length before bitmap data. **Bitmap compression and native palette remapping remain unimplemented.**

Source code: https://github.com/the3dfxdude/7kaa (GPL-2.0-or-later headers). Emscripten resources catalogued from https://github.com/CzekUns/sevenkindomsmobile/tree/main/data.

## Actual artifacts and limits

**Unit converted:** 0. **Town converted:** 0. **Original PNG atlases verified:** 0. **Pixel-level visual comparisons:** 0.

The source repository lists `SPRITE.data` (6,281,403 bytes), `RESOURCE.data` (22,135,228 bytes), `IMAGE.data` (7,094,759 bytes), and other Emscripten bundles. Companion `.js` files describe mounting. Their existence does not mean extracted `.SPR` and DBF data have been opened. Their graphics rights must be separately verified before redistribution: the upstream GPL source license alone is **not** evidence that every commercial game graphic, music track or font is GPL. Do not commit large packs or republish converted art before permission/provenance review.

Required next work: unpack mounted Emscripten FS using a legal local copy, locate `STD.SET`, `SPRITE/SACTION/SFRAME` and actual `.SPR` files; implement and validate bitmap compression + palette/transparency/remap; identify original town resource structures; produce unit/town PNG atlas with image-based A/B verification at 1×/2× and 8 directions, count declared vs distinct animation frames. G1 is **BLOCKED**, not passed.

## Handoff to integration

No `view.js` integration yet. Consumers must reject any frame whose `decoded !== true` or `path === null`. Do not infer that numeric `direction` equals the viewport-facing direction. The catalog is tooling-only; no asset is ready for shipping.

Tests: synthetic structural fixtures for RES, DBF, SFRAME, manifest fail-closed and checksums. The full project test command `npm --prefix seven-kingdoms-html test` remains mandatory in CI; no claim of a successful run is made without actual execution.
