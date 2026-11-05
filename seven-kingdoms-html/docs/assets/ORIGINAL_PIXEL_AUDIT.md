# Original 7KAA pixel extraction: verified evidence and incomplete gates

Status: **pixel-decode validated on upstream bytes; visual parity NOT approved; browser integration NOT started**.
Issue refs: #7, #19, #44. PR: #13 (draft).

## Source and rights

- Canonical upstream repository: `the3dfxdude/7kaa`, commit `14e6fdfba9481af4dc3a54722614a608776e20bc`.
- The source README documents Enlight Software's 2009 free/open-source grant for Seven Kingdoms: Ancient Adversaries and the accompanying `COPYING` grants GNU GPL v2 or later.
- We use only files from the game's GPL release in that upstream source tree. **This is not a license conclusion for independent CD releases, unofficial graphics, modifications, or music** (soundtrack has a separate notice).
- `CzekUns/sevenkindomsmobile/data/{SPRITE,RESOURCE,IMAGE}.js/.data` packages are Emscripten LZ4 containers. Their original-content IDs should be compared with the GPL source before distribution. The HTML application uses native JavaScript, not the WebAssembly engine.
- No original bulk SPR/RES archives have been committed into Rtsmobile. A minimal two-record verbatim original GPL fixture (`tests/assets/fixtures/original-7kaa-pixels.json`) and two inspected PNG sheets are stored for repeatable source tests/visual review.

## Real original source files pinned to upstream Git objects

| File (under upstream `data/`) | Blob SHA-1 | Usage |
|---|---|---|
| `SPRITE/NORMAN.SPR` | `c9c02320d6f8d22aa29f4455fc285188d0676143` | unit pixel payload |
| `RESOURCE/I_FIRM.RES` | `cf82d2ef5c5189bd308e554f0344414ad15b5a3b` | firm bitmap payload |
| `RESOURCE/STD.SET` | `d034bb9a627bb1076642de880021a7f7c1839ea4` | original DBF tables |
| `RESOURCE/PAL_STD.RES` | `8535b2b54b9be8f39580489b54a783fb81785979` | 256 RGB entries after 8-byte header |

The full-archive SHA-256 checksums are computed by the conversion tools and saved into each **locally generated** asset manifest; Git blob SHA-1 values above are not mislabeled SHA-256.

## Decoder provenance and technical findings

- `src/ORESX.cpp` indexed RES has table-name/index/offset structure; `src/ORESDB.cpp` imported bitmap RES is a **different format** with `u32 length` preceding `u16 width,u16 height`.
- `src/imgfun/generic/IB_TD.cpp`, `include/COLCODE.h`: byte values below `F8` are palette indices; `F9..FF` encode 7..1 transparent pixel skips; `F8 n` encodes skip length `n`. The raster fills from left to right, row by row. A decoded bitmap must consume its entire declared record and generate precisely width × height pixels.
- `src/OVGA.cpp::load_pal`: `PAL_STD.RES` contains 8 bytes before the 256 × 3 byte RGB palette.
- `src/OGAME.cpp::init_remap_table/get_color_remap_table`: only original indices `E0..E7` map to each nation's primary/secondary 4-shade ranges. Unselected `F2` becomes transparency and `F3` becomes index 0. Arbitrary painting of every pixel is incorrect. A building's `G` layer is drawn *without* remap by `OFIRMDRW.cpp`.
- `src/OSPRITE.cpp::need_mirror` gives mirror rules. Direction IDs `0..7` face north clockwise; rotation-resolutions `16/24` have different mirrored subdirection rules.
- Original DBF rows embedded in `STD.SET` contain the one-byte `20` hex trailer. `SFRAME.direction` is textual, unlike `SACTION.dir_id` (numeric).

## Asset 1 — NORMAN, original unit

- `SPRITE` ID/record: `NORMAN`, `SPRITE:1`, source `NORMAN.SPR`.
- `SACTION` records 1–8: movement `M`, directions `0..7`, each **6 declared frames**. `SFRAME` source frame IDs 1–48.
- Real bitmap stream verification: **48/48** decompressed without truncation, dimensions mismatches or raster overflow. Exactly **5 distinct original pixel images per direction**. The fourth animation frame duplicates the first; this is an intentional *source record reference*, not a missing sprite.
- Idle/stop: there is no separate `S` action for NORMAN. `OSPRTRES.cpp` explicitly sets the first movement frame as default stop. The local converter records the derived idle with `fallbackFromMovement` rather than falsely claiming a standalone source bitmap.
- `SFRAME:1` at source offset **23641**: bitmap 35×46, offset (-4,-17), payload length 1200 bytes, **1108 opaque**, **502 transparent**. Source record byte length 1204.
- Verified original PNG contact sheet: [NORMAN-M-1x.png](../../assets/previews/NORMAN-M-1x.png) (8 columns = directions 0..7; 6 rows = movement frames 1..6). Mirrored where the engine prescribes, with original offsets.
- **Not approved yet**: alignment to exact running game anchor, action/turn timing with group movement, overlay/selection states, replay parity screenshots.

## Asset 2 — BASE:NORMAN, original Seat of Power

- Original building record `FBUILD:1`; `FIRM` code `BASE`, `race_code=NORMAN`. Grid footprint: **4×4** from `FBITMAP`.
- Original resources: `I_FIRM.RES` FBITMAP records **1/2/3** (three stages `U`), record **4** completed `A` (also default idle), record **5** ground `G` display layer 4.
- Original stream audit: **5/5** payloads fully decoded; no dimensions or RLE errors. Example first stage: source offset **406985**, 93×77, 4479 opaque, 2682 transparent.
- Construction phases drawn from `FBUILD` bitmap counts; ground appears only for the **last** construction stage or completed. The ground (record 5) is not nation remapped. Stage/main bitmap nation shades are selectively mapped `E0..E7` according to `OGAME.cpp`.
- Contact sheet: [BASE-NORMAN-phases-1x.png](../../assets/previews/BASE-NORMAN-phases-1x.png) (left to right: stage 0, stage 1, stage 2, completed). Banners `FLAG-S0` are additional runtime overlays from `I_SPICT.RES`, **not yet included**.
- **Not approved yet**: full dynamic flags, verified selection-state overlays, placement on live terrain, layer ordering when units overlap, exact screenshot comparison.

## Reproducible local conversion without WebAssembly

With a checked-out upstream `7kaa` source folder containing `data/RESOURCE` and `data/SPRITE`:

```sh
node seven-kingdoms-html/tools/assets/decode.mjs --source /local/7kaa/data --out /tmp/skh-metadata
node seven-kingdoms-html/tools/assets/render-unit.mjs --source /local/7kaa --unit NORMAN --out /tmp/skh-norman
node seven-kingdoms-html/tools/assets/render-firm.mjs --source /local/7kaa --firm BASE --race NORMAN --scheme 1 --out /tmp/skh-base
SKH_7KAA_SOURCE=/local/7kaa node --test seven-kingdoms-html/tests/assets
```

Generated `unit.json` / `firm.json` contain record IDs, source files and SHA-256, source bitmap offsets, sequence, orientation, dimensions, transparent counts, nation remap policy, offset/anchor and `visuallyVerified:false`. The tools explicitly reject unsupported sprite remap modes or malformed source.

Without `SKH_7KAA_SOURCE`, the small original GPL byte fixtures still run in the normal CI suite; the two full-file extraction tests are **skipped**. Those local full-file tests must be executed again with a licensed upstream checkout and their outputs reviewed before claiming full end-to-end CI coverage.

## Remaining exact next gate

Capture the same original unit/building on 7KAA at 1× and 2×, and compare pixel-for-pixel geometry, orientation, remap and ground alignment to the contact sheets. **Until this gate is passed, do not open/merge a renderer-integration PR, change `view.js`/`game.js`/`index.html`, or turn on `visuallyVerified`.**
