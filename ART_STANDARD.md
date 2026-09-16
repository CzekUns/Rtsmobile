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

Units and animals do **not** require walk-cycle animation frames for the base implementation. Movement is simulated by switching between eight static directional PNG assets according to the current movement vector:

- `N` = facing up
- `NE` = facing upper-right
- `E` = facing right
- `SE` = facing lower-right
- `S` = facing down
- `SW` = facing lower-left
- `W` = facing left
- `NW` = facing upper-left

All eight variants of the same subject must use:

- the same canvas dimensions;
- the same visual scale;
- the same bottom-centre ground anchor;
- the same apparent body footprint;
- identical pixel density and lighting.

Only orientation changes between variants. The engine selects the directional PNG from the movement vector. When a unit is stationary, it keeps the last valid facing direction. This avoids visual jumping when the displayed asset changes.

## Engine mapping

The current gameplay engine still uses its existing logical tile size. P16 is an **art-space standard**, intentionally decoupled from gameplay coordinates while controls and simulation are still evolving.

When the sprite pipeline becomes authoritative, the intended target is a 32 px render tile at 1× presentation scale, i.e. 2 screen pixels per art-pixel, with integer-scale presentation wherever practical.
