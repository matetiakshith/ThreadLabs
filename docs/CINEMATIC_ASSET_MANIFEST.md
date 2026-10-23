# ThreadLabs cinematic asset manifest

All 17 GLB models and 9 PNG maps are original procedural assets created for this project. No third-party models, textures, faces, artwork, or trademarks are incorporated. Geometry and texture source is reproducible with `node scripts/build-cinematic-assets.mjs`. Generated reusable geometry/maps are dedicated under CC0-1.0; ThreadLabs brand remains the owner's.

Total asset payload: 2112.5 KiB. JSON runtime manifest: `client/public/cinematic/models.json`. GLBs embed standard PBR materials, use named meshes, and require no external resources. GLTFLoader is the supported loader. Units are meters, Y is up. Main hoop lies in XY with the embroidered face +Z; outer radius is 0.847. Models are individual purposeful scene props, not alternate exports counted as separate assets.

## Models

| Asset | Size | Bounds (x × y × z) | Purpose |
|---|---:|---|---|
| embroidery-hoop.glb | 179.7 KiB | 1.694 × 1.732 × 0.094 | Primary round craft object, hand grab, rotation, deconstruction and macro embroidery reveal. |
| thread-spool.glb | 637.1 KiB | 0.773 × 0.431 × 0.422 | Loose clay thread material, workshop and exploded craft components. |
| sewing-needle.glb | 41.9 KiB | 0.702 × 1.031 × 0.021 | Needle and eye for hand manipulation and close textile stitching. |
| dressmaking-scissors.glb | 74.5 KiB | 0.504 × 0.922 × 0.045 | Garment cutting tool in workshop and component spread. |
| seam-ripper.glb | 20.6 KiB | 0.171 × 0.68 × 0.094 | Small sewing tool with open hook and capped fork. |
| brass-thimble.glb | 122.2 KiB | 0.21 × 0.265 × 0.21 | Protective hand tool, brass material and close-up scale cue. |
| pin-cushion.glb | 56.0 KiB | 0.36 × 0.306 × 0.36 | Sewing pin cluster for workshop environment and exploded spread. |
| folded-linen.glb | 30.1 KiB | 0.837 × 0.161 × 0.526 | Unbleached folded cloth, workshop stack and material transformation. |
| draped-swatch.glb | 39.5 KiB | 0.9 × 0.95 × 0.149 | Subdivided draped textile with visible sewn hem. |
| garment-pattern.glb | 25.4 KiB | 0.86 × 1.05 × 0.005 | Original bodice pattern, technical blueprint and garment construction sequence. |
| tailors-ruler.glb | 75.9 KiB | 1.1 × 0.047 × 0.075 | Scaled wood ruler with forty marks for technical composition. |
| cutting-mat.glb | 43.3 KiB | 1.4 × 0.027 × 0.95 | Sage cutting surface with measured grid in workshop. |
| artisan-workbench.glb | 13.1 KiB | 3.35 × 0.93 × 1.88 | Craft workbench establishing a physical artisan studio environment. |
| task-lamp.glb | 21.0 KiB | 0.94 × 0.9 × 0.5 | Warm task lighting fixture for environmental context; scene supplies light. |
| hoop-stand.glb | 20.2 KiB | 0.65 × 0.99 × 0.48 | Separately articulated embroidery support for hoop placement and release. |
| sewing-bobbin.glb | 367.7 KiB | 0.26 × 0.18 × 0.26 | Machine bobbin, indigo thread and machined metal insert. |
| fabric-roll.glb | 23.1 KiB | 0.9 × 0.38 × 0.89 | Indigo textile roll with curved unrolled tail for material transitions. |

## Material and environment maps

| Map | Resolution | Size | Purpose |
|---|---:|---:|---|
| linen-albedo.png | 256 × 256 | 44.5 KiB | Cream woven textile color. |
| linen-bump.png | 256 × 256 | 54.5 KiB | Repeating warp and weft height, use as bump map with bumpScale .012. |
| linen-roughness.png | 128 × 128 | 13.6 KiB | High diffuse roughness for natural textile. |
| oak-albedo.png | 256 × 256 | 89.5 KiB | Warm wood ring and workbench grain. |
| oak-bump.png | 256 × 256 | 3.7 KiB | Fine directional wood grain relief. |
| indigo-weave.png | 256 × 256 | 43.4 KiB | Natural indigo cloth surface for roll and material reveals. |
| clay-thread.png | 128 × 128 | 12.3 KiB | Twisted clay thread color for macro embroidery. |
| studio-environment.png | 512 × 256 | 28.2 KiB | Original equirectangular studio lighting; use EquirectangularReflectionMapping. |
| pattern-paper-grid.png | 256 × 256 | 31.7 KiB | Pattern paper with construction grid. |

## Integration

Load `embroidery-hoop.glb` for the primary object. Use the named `outer-oak-hoop`, `inner-oak-hoop`, `linen-disc`, `embroidered-*` and `clamp-*` meshes for deterministic assembly/unwrap stages. Apply color maps using SRGBColorSpace; bump/roughness maps stay in linear space. Repeat linen maps 5–10 times across the hoop and use a subtle bumpScale (0.008–0.015). The environment PNG is an original low-dynamic-range studio reflection map, not an HDR capture. It should complement scene lighting rather than replace key lights.

GLB models are low polygon and individually streamed by the cinematic subsystem; they must not block account or application routes. Texture maps intentionally remain external to allow reuse and independent progressive loading.
