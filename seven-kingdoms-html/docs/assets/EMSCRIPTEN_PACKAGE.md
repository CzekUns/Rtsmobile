# Emscripten LZ4 package extraction — SKH-107 (#19)

Upstream reference: `CzekUns/sevenkindomsmobile/data/SPRITE.js` and `RESOURCE.js`. These are Emscripten preload scripts with `loadPackage({files:[{filename,start,end},...],remote_package_size})` plus `compressedData` LZ4 block metadata. The generated file offsets point to the **uncompressed virtual filesystem**; the associated `.data` is compressed in independent 2048-byte blocks with sizes, offsets and successes flags.

The native Node extractor parses only JSON metadata, never evaluates the generated code, decodes LZ4 block sequences and validates every virtual file extent. It records SHA-256 checksums for original package/script and extracted bytes. It does not change or upload the upstream repo.

```sh
node seven-kingdoms-html/tools/assets/emscripten-lz4.mjs \
  --js /local/sevenkindomsmobile/data/SPRITE.js \
  --data /local/sevenkindomsmobile/data/SPRITE.data \
  --out /tmp/7kaa-original

node seven-kingdoms-html/tools/assets/emscripten-lz4.mjs \
  --js /local/sevenkindomsmobile/data/RESOURCE.js \
  --data /local/sevenkindomsmobile/data/RESOURCE.data \
  --out /tmp/7kaa-original
```

This creates `data/SPRITE/*.SPR` and `data/RESOURCE/*` and a local extraction manifest. It does not convert bitmap pixels into PNG, interpret game palettes, or establish permission to redistribute the assets. `decoded:true` **must not** be set on the basis of extraction alone.

**Caveat:** tests exercise synthetic LZ4 and metadata fixtures, not the real binary packages in this execution environment. Check extraction of original packages and run byte-for-byte comparisons before using any material in a distribution. There are no authentic spritesheet previews or unit/village PNGs published by this PR.
