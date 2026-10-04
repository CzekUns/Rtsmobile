# Terra Italica — P16 visual standard

P16 is the canonical art grammar for Terra Italica.

- One terrain tile is conceptually **16 × 16 art-pixels**.
- One art-pixel is the smallest allowed graphic detail.
- Terrain, units, animals, buildings, props and effects must respect the same grid density.
- Rendering uses nearest-neighbour / no image smoothing.
- Terrain noise is deterministic: it never flickers from frame to frame.
- Terrain contrast stays low so gameplay entities remain visually dominant.
- Each biome uses a restrained base tone plus light, dark and accent variations.
- Macro-noise is organised in 4 × 4 art-pixel regions; sparse accents sit on the 16 × 16 grid.
- Water uses short horizontal P16 marks; rock uses compact angular clusters; soil and vegetation use sparse grain.
- Roads use chunky on-grid shapes rather than antialiased strokes.

## Directional unit standard

Units and animals do **not** require walk-cycle animation frames for the base implementation and do not require eight separate directional files.

Each subject uses one clean top-down PNG with a stable centre anchor. The renderer derives the current movement vector and rotates the PNG to the nearest of eight compass directions:

- `N` = up
- `NE` = upper-right
- `E` = right
- `SE` = lower-right
- `S` = down
- `SW` = lower-left
- `W` = left
- `NW` = upper-left

The source PNG is authored facing `S` (down). Rotation is quantised in 45° steps, so movement reads directionally without a walk-cycle. When an entity becomes stationary it keeps the last valid facing direction. Scale, centre point and footprint therefore remain stable while moving.

## Engine mapping

The current gameplay engine still uses its existing logical tile size. P16 is an **art-space standard**, intentionally decoupled from gameplay coordinates while controls and simulation are still evolving.

The current production PNG pipeline uses small native transparent assets and nearest-neighbour rendering. Terrain remains procedural/noise-based and is not replaced by terrain PNG tiles.

The intended long-term presentation target remains a 32 px render tile at 1× presentation scale, i.e. 2 screen pixels per art-pixel, with integer-scale presentation wherever practical.
