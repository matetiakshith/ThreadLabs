# ThreadLabs premium motion — audit and implementation map

Scope: existing React composition on dedicated `codex/premium-motion` branch. No backend, authentication, database, API, price, text, font, theme or content-order changes. Main and Render remain on the prior release until explicit approval.

## Active application map

The coordinator renders the landing index / collection / Three.js showroom, customer login and design studio, state/artisan discovery, commission tracker and artisan desk / profile editor. Older alternate dashboards and hero components remain in the repository but are not mounted by App.jsx; they are not decorated to manufacture extra sections.

| Existing area | Treatment and engine | Trigger | Resource / reduced-motion handling |
| --- | --- | --- | --- |
| Hero headline | React Bits SplitText adaptation, GSAP word masks | Mount, fonts ready | Semantic span/em, native spacing; unsplit readable text on failure/reduce |
| Campaign photograph / supporting copy / CTA | GSAP coordinated scale and stagger; React Bits Magnet inside CTA | Mount / pointer proximity | Anime owns parent photo mask and wordmark; Magnet owns inner wrapper only, capped 3px, fine pointer only |
| Collection silhouette and full fashion board | GSAP masks and caption choreography; reversible ScrollTrigger figure translation / caption rule | Viewport entrance and scrub | Full board details restored; no rotation or distortion; native static figure on reduce |
| Studio material aside | Short desktop GSAP pin of only the existing read-only workflow list | Maximum 280px scroll | Forms remain in natural flow, no mobile/short-screen pin; existing Three.js stays untouched |
| Editorial studio image | GSAP subtle scale/parallax on inner campaign image | ScrollTrigger scrub | Controlled editorial crop only; no zoom on generated garment images |
| Reference/sketch preview | React Bits AnimatedContent adaptation | Existing preview mount | Existing labels, file and sketch behavior untouched; native visible fallback |
| Generated fashion board | GSAP presentation mask; Motion gallery swaps and thumbnail reaction | Result entrance / selection | Motion owns image x/opacity; GSAP owns parent clipPath; error UI unchanged |
| Garment specification | GSAP text masks and parameter stagger | Existing content enters viewport | Original specification content and order preserved |
| Artisan results and portfolio photos | GSAP name/photo masks; React Bits AnimatedContent on saved portfolio articles | Entrance / upload mount | Existing Motion row hover retained; no global row transform conflict |
| India map | GSAP existing selection-caption reaction | State selection | Three.js camera, boundaries, labels and hit handling preserved |
| Commission journey | GSAP reversible connector progress and sequential row reveals | ScrollTrigger scrub / entrance | Actual order-stage percentage remains data-driven; no false progress |
| Beatle | Existing Motion SVG and panel curves; pause when offscreen / document hidden | Real assistant state | No assistant logic changes, no typewriter delay, reduced motion remains still |

## Audit findings and ownership

The prior shared Anime coordinator and Motion ScrollScene split scroll ownership across engines; no Lenis was installed. The old ScrollType changed headline letter spacing continuously, moving away from original typography. Both are replaced with scoped GSAP scroll choreography. Working Anime measurement expansion and CinematicIntro are retained. Working Motion inputs, result transitions, order updates and mascot remain. The India map already uses demand rendering; the cloth scene already caps work and stops when hidden/offscreen. Both remain intact and lazy loading is preserved.

Document scrolling is the outer scroll surface. Modal content, Beatle messages, thumbnail strips and 3D showroom/canvas controls have separate input semantics and are excluded from smoothing. Forms and measurement inputs always retain native wheel/focus handling.

## Integration details

GSAP 3.15.0, @gsap/react 2.1.2 and Lenis 1.3.26 are the only new dependencies. Existing dependency versions are unchanged. Scoped useGSAP hooks own the hero, selection caption and React Bits effects. The shared coordinator uses one GSAP matchMedia tree and a per-element context registry, then reverts detached nodes on conditional navigation. Setup waits one frame for the App host ref; StrictMode cancels the first scheduled setup. No global killAll or persistent detached triggers.

ScrollTrigger drives collection figure translation, caption-rule growth, studio editorial image scale/parallax and commission connector progress with scrub .45. Masks use once-only entrance timelines and clear their styles after finishing. The studio workflow list pins only on a fine-pointer desktop at least 1100px wide and 740px high, when existing section height supplies room. Its duration is bounded by the available space and 280px. Measurement expansion can enable the story; collapsing it removes the pin. Forms and preview controls remain in the document flow. The actual order status is unchanged by scroll progress.

Lenis is active only for fine-pointer desktops at least 1024px wide without reduced motion. autoRaf is disabled; GSAP ticker time is converted to milliseconds for lenis.raf, and Lenis scroll events call ScrollTrigger.update. lerp .16 avoids prolonged inertia. Touch remains native. Forms, editable controls, measurement/sketch/voice areas, map/showroom controls, modal dialogs, assistant content, thumbnails and data-lenis-prevent regions keep native input. Same-document anchors use the documented scrollTo API with native hash/history updates and modifier guards. Focus refreshes Lenis dimensions before reconciliation, preventing a newly mounted taller form from snapping to the previous page limit. Body overflow locks stop Lenis; unlock, pageshow and history navigation reconcile it. Visibility changes pause unnecessary work. Media changes and unmount remove listeners, observers and ticker callbacks, then destroy the instance.

React Bits source is adapted selectively, with attribution and the full upstream MIT + Commons Clause license in components/ReactBits/LICENSE.md:

- SplitText: the existing three hero lines, preserving semantic span/em and inherited typography, with GSAP word masks and font-ready setup. Original readable text survives failure/reduced motion.
- Magnet: only the existing hero CTA. Its inner spring translation is bounded at 3px; tilt is disabled. It responds to live reduced-motion/fine-pointer changes and removes listeners on unmount.
- AnimatedContent: existing reference/sketch review and saved portfolio articles. Semantic tags and original styling remain; the restrained entry clears inline transforms when complete.

The hero is a child view with its own mounted ref, so returning from Collection replays its choreography after AnimatePresence has inserted its DOM. Animation-initialization catches restore readable, visible content. Images and font readiness refresh ScrollTrigger; a debounced ResizeObserver handles form height changes. Keyboard focus completes an unfinished entrance rather than leaving focused content masked.

## Verification

Chrome was driven with Playwright against the real Vite development application in React StrictMode at 1440×1000 and touch 390×844. Local HTTP authentication/profile/gallery routes use the existing server code with an in-memory PostgreSQL-compatible PGlite database. AI image generation, assistant responses and private object storage are explicit local test doubles. Screenshots label generated fixture imagery. No production account, database or external provider was exercised.

The primary acceptance suite passed 16 checks with zero uncaught browser errors. Four additional mobile product checks, five preservation/failure checks and three anchor/history/modifier checks passed. Coverage includes customer and artisan signup/sign-in, native form focus, saved profile and portfolio upload/removal, measurement conversions, sketch strokes, three-view gallery selection/download/fullscreen, map search/reset, marketplace reveals, order connector, assistant draft actions and nested scrolling, dark theme, live reduced-motion switching and repeated navigation.

At least five existing areas were exercised: hero, collection studies, studio aside, generated board, marketplace and commission journey, plus artisan profile/portfolio. Recorded real forward/back scroll samples cover collection translation, caption-rule progress, studio editorial image and order connector; the short story pin also held the same screen position at increasing and decreasing scroll offsets. These effects were checked on desktop; collection, studio/form, gallery, marketplace and order views were checked in a mobile touch viewport. Mobile and reduced-motion checks create no pins. Resting hero text, colors, computed font metrics and geometry match the baseline at both widths with and without reduced motion, within 1px. Injected GSAP/SplitText setup failures leave the hero, CTA and collection visible. React Bits word transforms and bounded Magnet movement were captured; saved portfolio AnimatedContent reaches its visible resting state.

Repeated Index/Collection navigation retained four collection ScrollTriggers, with zero detached triggers or accumulation. Live reduced motion reverted all triggers and smoothing; restoring the preference rebuilt the appropriate effects.

A 90-frame sample during active collection scrolling at 4× CPU throttling recorded a 16.7ms median, 33.4ms p95, zero intervals above 50ms, zero long tasks and no layout-shift entries in that sample. This is a short headless desktop measurement using software WebGL, not a 60FPS guarantee or a physical mobile battery test. The full 3D showroom and every geographic click target were not exhaustively profiled.

Validation commands: npm run test, npm run lint and npm run build in client. All 22 frontend tests pass. Lint exits successfully with the same 196 warnings as the baseline; no new warnings. Production build succeeds. Its main JS bundle is about 230.8kB gzip (Vite), adding about 52kB gzip for GSAP, SplitText and Lenis. Existing separate/lazy Three.js, showroom, cloth and map chunks remain. The pre-existing >500kB bundle warning remains; no unrelated dependency upgrades were introduced. git diff --check passes.

## Files and scope

Changed existing files:

- client/package.json and client/package-lock.json
- client/src/App.jsx
- client/src/components/ThreadLabsLanding.jsx
- client/src/components/Motion/{AtelierMotion.jsx,ScrollScene.jsx,motion.css,motionCoordinator.js,motionCoordinator.test.js}
- client/src/components/Needs/{CustomerNeeds.jsx,FashionCollection.jsx}
- client/src/components/Artisans/IndiaArtisanMap.jsx
- client/src/components/ArtisanPortal/ArtisanProfileEditor.jsx
- client/src/components/Beatle/{BeatleAssistant.jsx,BeatleMascot.jsx}

Added files:

- client/src/components/Motion/{engine.js,motionPolicy.js,SmoothScroll.jsx}
- client/src/components/ReactBits/{SplitText.jsx,Magnet.jsx,AnimatedContent.jsx,LICENSE.md}
- docs/PREMIUM_MOTION.md

Branch: codex/premium-motion, based on main 647f9af. The final implementation commit is recorded in the accompanying output report and git log. Source changes are limited to client motion and this report; no server code, environment variables, Render configuration, database, pricing, order logic or production credentials changed. Original main checkout and its existing uncommitted documentation remain untouched. The branch is committed locally; it is not merged, pushed or deployed.

Remaining limits: external AI, assistant, object-storage and email operations still require configured production providers and credits. Fixtures confirm UI wiring, not provider quality or availability. Physical-device/browser matrix testing and exhaustive 3D profiling remain outside this acceptance run. There are no new sections, backgrounds, mascot artwork or layout changes.

## Primary references

- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [React integration](https://gsap.com/resources/React/), [SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)
- [Lenis](https://lenis.dev/) and [official integration/readme](https://github.com/darkroomengineering/lenis)
- [React Bits](https://reactbits.dev/), [SplitText source](https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/SplitText/SplitText.jsx), [Magnet source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/Magnet/Magnet.jsx), [AnimatedContent source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/AnimatedContent/AnimatedContent.jsx), [license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)
