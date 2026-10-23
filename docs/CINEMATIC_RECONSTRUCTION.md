# ThreadLabs cinematic reconstruction — hand removed

**Latest user direction: “JUST REMOVE HAND PART.”** The current revision removes the 3D hand and its full 9.3-unit scene interval. This supersedes the previous mandatory-hand requirement. The homepage retains its original ThreadLabs hoop, craft environment, remaining scene order, branding, Keeto and application callbacks. No hand or finger interaction is claimed for the current version.

## Modules and ownership

| Module | Responsibility |
| --- | --- |
| `client/src/components/Cinematic3D/CinematicExperience.jsx` | Homepage lifecycle, dynamic Three.js import, paused Anime.js DOM/SVG timeline, visible/inert controls, existing entry links and static fallback. |
| `scrollController.js` | Native scroll measurement, one pending RAF, 68 ms frame-rate-independent settling, resize/invalidation and disposal. |
| `timeline.js` | **62.7-unit master clock, 17 chapters**, original visual-time mapping with source 6.2–15.5 omitted, smooth camera position/target/FOV tracks. |
| `craftScene.js` | Three.js camera, hoop, tools, environment, wrapper/material planes, image rails, loading/batching/rendering and diagnostics. No hand creation, bones or grip logic. |
| `photography.js` | Eight local licensed craft-image records and attribution. |
| `cinematic.css` | Sticky passage, responsive layout, overlay hierarchy, static fallback and normal-flow closing. |
| `scripts/build-cinematic-assets.mjs` | Reproducible original GLB and texture/environment asset generation. |

Three.js owns spatial transforms/materials/lights; Anime.js owns a pre-created seekable DOM/SVG timeline from the same master progress. Existing Motion owns application/UI transitions. There is no competing Lenis controller or GSAP ticker. A pure absolute state evaluator makes reverse/direct seeks repeatable; damping affects only convergence to native scroll. Rendering requests stop when settled and resume on input/load/resize invalidation. Closing has no ambient autoplay. Cleanup removes frame requests, observers/listeners and rendering resources.

## Remaining cinematic sequence

The local review artifact `docs/CINEMATIC_STORYBOARD.md` lists source-time and elapsed-master ranges. The sequence is object turn → wrapper opening → eight-image rail → 3D workshop → overhead/construction separation and reassembly → ThreadLabs wordmark → return flip → linen/embroidery macro → material split → typography/columns/process feed → second rail → selector/closing.

The old hand interval, source visual time **6.2–15.5**, is skipped. Master progress now maps through 62.7 authored units rather than 72. Closing source time 71.5–72 becomes master **62.2–62.7**, then the sticky stage releases into natural-flow feature details and footer. The chapter named `details` is metadata during the selector transition; it is not a separate in-pin specifications-table reproduction.

The primary hoop is genuine GLB geometry with named wood, fabric, embroidery and clamp parts. The workbench composition raises the hoop above the table to retain a readable frontal plane. Wrapper halves use subdivided curved planes. Static 3D workshop tools batch by PBR material; macro cloth uses instanced warp/weft. Hemisphere/key/rim/fill light and an original LDR environment map provide shading. A soft radial contact cue avoids real-time shadow maps. Camera position/target/FOV interpolate authored keys and orient with `lookAt`; exact source matrices or captured spline paths are not claimed.

## Assets and rendering

[Asset manifest](CINEMATIC_ASSET_MANIFEST.md): **26 distinct original files, 17 GLB models and nine PNG maps**, approximately 2.06 MiB (2112.5 KiB). These assets are retained after hand removal; the removed procedural hand was separate from the 26-file inventory. Eight licensed existing craft photographs support both rails and retain attribution. Reference screenshots/source product assets are never runtime scenes.

Loading remains progressive: dynamically import the renderer; load small reusable maps, then the primary hoop; stream props with at most **three concurrent model loads**; load/reuse craft photographs. Assets invalidate demand rendering as they arrive. Standard self-contained PBR GLBs and small PNG maps are used; KTX2/Basis/Draco/Meshopt compression is not claimed.

Performance controls retain camera reframing, capped DPR (1.25 mobile, 1.5 desktop), reused geometry/materials, static batching, instanced weave and no live shadow maps. The runtime hand-generation startup cost is removed. Viewport-based quality controls are implemented; a GPU-feedback adaptive quality scaler is not.

## Accessibility and preservation

Reduced motion skips the pinned animation; WebGL/load failure or context loss presents a visible static craft narrative with existing links. Inactive controls are hidden/inert, and Skip to the atelier bypasses the passage. Customer/artisan registration/login, design inputs/board, measurements, discovery/map, order APIs and Beatle behavior are preserved through existing application modules. This homepage revision needs no account/schema/credential/database/environment change.

Read-only production baseline showed database/account/phase2 readiness, protected routes returning 401, six legacy artisan/heritage entries and valid SPA/asset routing. Image generation already reported `configured:false`, and publicly registered artisan listings were empty. Real provider success, authenticated production transactions and virtual try-on are not newly verified or restored by this homepage change. No production test accounts/orders are created.

## Reference, tests and QA scope

The original local `docs/CINEMATIC_REFERENCE_ANALYSIS.md` retains **60 selected frames** (48 representative plus 12 additional transition details) from 172 reviewed half-second samples and extra quarter-second extracts. The hand analysis is historically accurate to the recording but **intentionally excluded from the shipping story by the latest user request**. The supplemental 21-second raspberry study is documented separately without assuming it depicts ThreadLabs.

After removing five hand-specific tests, the client suite contains **36 tests**: 26 existing application checks plus six timeline/camera and four scroll-controller checks. The unchanged backend suite contains **34 tests** using isolated embedded PostgreSQL and explicit provider/storage fixtures. Fresh hand-removal test/build/browser outcomes are recorded by the implementation owner; prior 40-test and hand-sequence results belong to the superseded revision.

Earlier local/production screenshots and 16.7 ms median hand-sequence measurements refer to the previous hand-containing release. They must not be asserted as new hand-removal performance evidence. New browser QA should verify the object-to-wrapper transition, complete remaining scene sequence, reverse scroll, responsive layouts, fallback and application entry navigation. Frame pacing/CPU submission do not prove physical mobile GPU performance.

Remaining original-reference differences include original hoop/workshop/photography and framing, regular procedural linen, faceting visible at extreme macro, and now the explicitly requested absence of the hand. No exact reconstruction or universal 60 FPS claim is made. Reference/QA screenshots and supporting analysis are local review artifacts excluded from the deployment commit; this engineering overview and original asset manifest are repository documents.

## Deployment status

**The hand-removal release is pending deployment and fresh live verification at this document revision.** The prior hand-containing release `1fc6c84eefbed69269339355d2c0f167d8a5f7a0`, deploy `dep-dbdqil8n74is73einbq0`, was verified live on October 24, 2026 at 00:08:16 IST, with all 26 assets and baseline APIs verified. That evidence is historical and does not satisfy the latest user request.

Target remains [threadlabs-current.onrender.com](https://threadlabs-current.onrender.com), service `threadlabs-current` (`srv-db6g9dad0e5s73al15k0`), user-confirmed Abhiram workspace `tea-db6g6pivcj2c73aqfmjg`. Preserve `threadlabs-current-db` (`dpg-db6g7did0e5s73akqdpg-a`). Auto-deploy is off; after the tested source is pushed, trigger only this web service, monitor its new deploy ID until live, and verify the new public revision, retained assets, absence of hand and working remainder. No production environment or database change is required.
