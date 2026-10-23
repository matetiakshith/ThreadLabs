# ThreadLabs cinematic reconstruction

The homepage's old cinematic mount path has been replaced by a new Three.js scene and one deterministic scroll controller. The existing application remains connected through the same Atelier/Studio/Collection callbacks. ThreadLabs cream/ink/clay colors, serif/sans typography, original craft photography and Keeto remain. This work concerns ThreadLabs exclusively; contradictory ReSolv names and routes in the pasted master prompt were superseded by the explicit user request.

## Modules and responsibility

| Module | Responsibility |
| --- | --- |
| `client/src/components/Cinematic3D/CinematicExperience.jsx` | Homepage lifecycle, dynamic scene import, one paused Anime.js timeline for DOM/SVG, visible/inert layers, entry links, fallback and resource cleanup. |
| `scrollController.js` | Native scroll/resize measurement, one pending RAF, 68 ms frame-rate-independent exponential settling, invalidation and disposal. |
| `timeline.js` | Pure 72-unit master clock, 18 chapters, envelopes/ranges and smooth camera position/target/FOV sampling. |
| `craftScene.js` | Actual Three.js renderer, camera, 3D hoop/tool/environment layers, articulated hand staging, wrapper/texture planes, image rails, loading, batching, rendering and diagnostics. |
| `handRig.js` | Original continuous implicit glove surface, normalized 22-bone skeleton, absolute repeatable finger/wrist poses, optional fingertip target solver and disposal. |
| `photography.js` | Eight local craft-image records with source author/license attribution. |
| `cinematic.css` | Sticky passage, responsive composition, overlay hierarchy, readable fallback and normal-flow closing details. |
| `scripts/build-cinematic-assets.mjs` | Reproducible original GLB/material/environment generation. |
| `scripts/cinematic-browser-qa.mjs` | Browser capture/diagnostic harness; see stored evidence and its explicit API-availability limitations. |

Three.js owns camera, meshes, bones, materials and lights. Anime.js owns a pre-created paused DOM/SVG timeline, seeked from exactly the same master time. Existing Motion remains responsible for interface and route interactions. No Lenis/global smooth-scroll owner or GSAP ticker participates in the new homepage. The pure evaluator determines the intended visual state at a given progress; the damping stage only controls convergence toward native scroll.

The controller requests another frame only while settling or when a load/resize invalidates the scene. Once settled, rendering sleeps. The closing thread ring is also scroll-linked; there is no ambient autoplay. Component cleanup cancels pending RAF, observers/listeners and Anime effects and disposes Three.js resources. No independent loop controls the same transform.

## Scene and hand implementation

The local review artifact `docs/CINEMATIC_STORYBOARD.md` lists exact `time / 72` chapter ranges. The sequence covers object turn, glove approach/grip/hold/release, wrapper opening, eight-image rail, 3D workbench, overhead construction and separated/wireframe hoop parts, ThreadLabs wordmark, return flip, linen/embroidery macro, split material, large typography, columns, process feed, second image rail, selector and closing CTA. The closing chapter occupies 71.5–72; full feature details/footer then use ordinary document flow. The chapter named `details` is metadata during the selector transition, not a separate reconstructed source specifications table inside the pin.

The hero object is a genuine shallow embroidery hoop GLB with independently named wood, fabric, embroidered and clamp geometry. Wrapper halves are subdivided curved planes. Workshop props are loaded as real geometry, then static geometry is merged by actual PBR material. Macro linen includes instanced warp/weft strands. Scene lighting uses a hemisphere plus key/rim/fill lights and an original LDR environment map. A soft painted radial contact cue avoids expensive live shadow maps; it is not physically simulated contact shadowing.

The hand is independently authored geometry with a closed continuous skin, skinned to wrist/palm and five articulated finger chains. It enters below, curls into the authored lower-rim grip, moves with the hoop's shared object root, releases and exits. All states are derived from absolute master time, so direct seeks/reverse scrolling do not depend on previous reparenting or physics state. An optional fingertip solver exists and has focused tests, but scene contact currently uses authored placement/curls. The broader procedural glove and finger placement visibly differ from the source. Rig diagnostics are not a proof of exact surface contact or collision-free anatomy.

Camera movement uses smoothly interpolated authored position, target and FOV keys; the scene computes orientation with `lookAt`. It does not claim recovered source cameras, spline-orbit capture or full quaternion camera-key reconstruction. Object rotations are authored over bounded continuous intervals and reset from known transforms each evaluation.

## Assets, loading and performance strategy

[Asset manifest](CINEMATIC_ASSET_MANIFEST.md) records **26 distinct original runtime assets: 17 GLB models and nine PNG material/environment maps**, approximately 2.06 MiB combined (2112.5 KiB). The original hand is generated at runtime in addition to that file inventory. Eight pre-existing licensed craft photographs support the image rails and retain attribution. No reference screenshot, source product model, packaging or source brand is used as a website scene.

The renderer module is imported on demand. Nine small reusable textures load first, followed by the primary hoop. The first object can render before the rest of the environment finishes; workshop props stream with at most **three concurrent model loads**. Craft photographs then load sequentially and are reused across both rails. Invalidations display new resources as available. Standard PBR GLBs have no external binary dependencies; texture maps reuse color/bump/roughness data. PNG maps are intentionally small; this implementation does not claim KTX2/Basis/Draco/Meshopt compression.

Quality controls include portrait camera reframing, lower hand detail below 700 px, capped DPR (1.25 mobile / 1.5 desktop), shared materials/geometry, static tool batching, instanced weave, no real-time shadow maps and demand rendering. Quality is selected by viewport; no measured GPU-feedback quality scaler is implemented. The implicit glove authoring pass runs on the main thread at scene initialization and remains a startup cost.

## Accessibility and failure handling

Reduced motion skips the pinned animated passage and uses a static narrative with craft images, credits and existing links. WebGL creation/load failure or context loss switches to the same visible fallback; context loss prevents a silent blank canvas. The opening UI and inactive overlay controls are hidden/inert after their handoffs. A persistent Skip to the atelier action allows bypassing the long passage. Existing customer/artisan behavior is not replaced with homepage demonstrations.

## Reference evidence and validation

Reference analysis, storyboard, preservation audit and comparison captures are local review artifacts excluded from the deployment commit. Their paths below refer to the shared local workspace; the engineering overview and original asset manifest are included in the repository. Reference screenshots are not deployed.

The local review artifact `docs/CINEMATIC_REFERENCE_ANALYSIS.md` records **60 selected timestamped frames**: 48 representative states plus 12 additional quarter-second transition details, selected after reviewing all 172 half-second samples. Four documentation contact sheets cover the sequence and the hand approach/contact/release in detail. The supplementary 21-second recording is separately documented as a raspberry rotation/macro study of uncertain application identity.

Current validation: **40 client tests and 34 backend tests pass**. Client coverage includes 14 new cinematic timeline/camera/hand/controller checks alongside the 26 existing checks. Backend tests use isolated embedded PostgreSQL and explicit provider/storage fixtures; initial sandbox loopback restrictions were resolved by approved rerun, without source/test changes. The local `docs/CINEMATIC_PRESERVATION_AUDIT.md` distinguishes these tests from live authenticated verification.

Production build/lint and browser evidence are maintained by the implementation/QA owner. Local `docs/cinematic-reconstruction/COMPARISON_NOTES.md` and `docs/cinematic-reconstruction/qa/index.html` record captured hand, rails, workshop, macro, reverse, resize, context-loss and reduced-motion states. Local browser cinematic assertions passed, but the full QA harness reports a failure for local API availability (502 during backend startup, later 503 with local persistence unavailable). That failure must not be presented as a fully passing application end-to-end run.

The active-scroll measurements use local headless Chrome on this Mac, with desktop and emulated-mobile viewports. Reported median frame interval is 16.7 ms across 360 forward/reverse hand-sequence frames; p95 is 16.7 ms desktop / 16.8 ms mobile viewport. Render-submission CPU p95 is 0.7 ms / 0.5 ms respectively. This measures CPU submission and RAF pacing, not GPU completion or physical phone performance. Do not infer a universal 60 FPS guarantee.

Specific remaining differences include a larger hoop, broader glove/lower-rim grip, different active-image spacing, an original oblique sewing workshop instead of the source frontal room/thermal palette, regular procedural linen and visible faceting at extreme embroidery scale. Macro readability received a final contrast adjustment; prior screenshots may precede that correction. No exact visual match is claimed.

## Preservation and production status

The reconstruction does not require backend code, account logic, schema, database, credentials or Render environment changes. The working checkout already contained prior profile/portfolio/login/recommendation fixes; those existing changes are preserved, distinct from this homepage subsystem rebuild. Do not deploy obsolete source just to match the earlier live premium-motion branch.

Read-only pre-deployment production checks report PostgreSQL account/phase2 readiness, protected endpoints returning 401, six legacy artisan/heritage entries and normal SPA/asset 404 behavior. The image provider already reports `configured:false`, and the registered public artisan directory has zero entries. Real production image generation, authenticated customer/artisan transactions and virtual try-on are not newly verified or claimed restored by this task. No production test accounts/orders were created.

**Deployment is pending at this document revision.** Confirmed target: `threadlabs-current` (`srv-db6g9dad0e5s73al15k0`) in Abhiram's workspace (`tea-db6g6pivcj2c73aqfmjg`), public URL `https://threadlabs-current.onrender.com`. Preserve `threadlabs-current-db` (`dpg-db6g7did0e5s73akqdpg-a`). Service uses main/root blank, Node/free/Singapore, existing build/start commands and `/api/health`; auto-deploy is disabled. Push the tested source, verify its SHA, trigger only the correct web service, monitor its returned deploy ID until `live`, inspect logs, and verify the public revision, all runtime assets and browser sequence. Record final status/commit/deploy evidence after those checks; a trigger alone is not deployment success.
