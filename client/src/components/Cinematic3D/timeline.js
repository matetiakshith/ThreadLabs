/**
 * ThreadLabs' single scroll clock. All scene values are sampled from absolute
 * reference seconds; no animation state or elapsed-frame accumulation is used.
 * The omitted 6.2–15.5 reference interval occupies no scroll distance.
 */
export const DURATION = 62.7;
const REFERENCE_DURATION = 72;
const CUT_START = 6.2;
const CUT_END = 15.5;
const CUT_DURATION = 9.3;

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const smoothstep = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** Clamped linear progress through a reference-time interval. */
export function range(time, start, end) {
  if (start === end) return time >= end ? 1 : 0;
  return clamp((time - start) / (end - start));
}

/** Smooth fade in, hold, fade out; useful for any 3D or DOM scene layer. */
export function envelope(time, inStart, inEnd, outStart, outEnd) {
  return smoothstep(range(time, inStart, inEnd)) * (1 - smoothstep(range(time, outStart, outEnd)));
}

/** Map the edited master clock onto the original authored scene timestamps. */
export function toReferenceTime(masterTime) {
  const time = clamp(masterTime, 0, DURATION);
  return time < CUT_START ? time : time + CUT_DURATION;
}

const chapterStarts = [
  ['intro', 0, 'A living atelier'],
  ['object', 2, 'The object'],
  ['wrapper', 15.5, 'Unwrapping an idea'],
  ['gallery', 19.5, 'A collection of possibilities'],
  ['workbench', 35, 'At the workbench'],
  ['construction', 41.5, 'Construction'],
  ['wordmark', 45.5, 'ThreadLabs'],
  ['return', 48.3, 'Return to the material'],
  ['macro', 52.5, 'A closer look'],
  ['split', 55.5, 'Two sides of craft'],
  ['type', 57.5, 'Ideas made tangible'],
  ['columns', 60.5, 'Material and meaning'],
  ['process', 61.5, 'The process'],
  ['collection', 63.5, 'The collection'],
  ['selector', 67.8, 'Choose a direction'],
  ['details', 69.2, 'The details'],
  ['closing', 71.5, 'Make it yours'],
].map(([id, start, label]) => [id, start >= CUT_END ? Number((start - CUT_DURATION).toFixed(6)) : start, label]);

export const chapters = Object.freeze(chapterStarts.map(([id, start, label], index) => Object.freeze({
  id, start, end: chapterStarts[index + 1]?.[1] ?? DURATION, label,
})));

export function evaluateTimeline(progress) {
  const time = clamp(progress) * DURATION;
  let chapterIndex = 0;
  for (let i = 1; i < chapters.length && time + 1e-10 >= chapters[i].start; i++) chapterIndex = i;
  const chapter = chapters[chapterIndex];
  return {
    time,
    referenceTime: toReferenceTime(time),
    chapter: chapter.id,
    chapterIndex,
    chapterProgress: range(time, chapter.start, chapter.end),
  };
}

// Original camera staging, matched to the reference's scene order. Coordinates
// face an XY-plane object at the origin, with +Z toward the viewer. Hold keys
// preserve the authored reference curve; the removed interval is skipped by
// toReferenceTime rather than adding another clock or animation owner.
export const cameraKeyframes = Object.freeze([
  { time: 0, position: [0, -.15, 7.2], target: [0, 0, 0], fov: 34 },
  { time: 2, position: [0, 0, 5.5], target: [0, 0, 0], fov: 34 },
  { time: 6.2, position: [0, 0, 5.5], target: [0, 0, 0], fov: 34 },
  { time: 15.5, position: [0, 0, 5.5], target: [0, 0, 0], fov: 34 },
  { time: 20, position: [0, 0, 7], target: [0, 0, 0], fov: 36 },
  { time: 35, position: [0, 0, 7], target: [0, 0, 0], fov: 36 },
  { time: 37, position: [0, 1.15, 5.5], target: [0, -.1, 0], fov: 34 },
  { time: 40.5, position: [0, 1.15, 5.5], target: [0, -.1, 0], fov: 34 },
  { time: 41.5, position: [0, 5, 1.1], target: [0, -.2, 0], fov: 34 },
  { time: 43, position: [0, 1, 5], target: [0, 0, 0], fov: 34 },
  { time: 45.5, position: [0, 1, 5], target: [0, 0, 0], fov: 34 },
  { time: 48.3, position: [0, 0, 5.5], target: [0, 0, 0], fov: 34 },
  { time: 52.5, position: [0, 0, 3.2], target: [0, 0, 0], fov: 34 },
  { time: 54, position: [0, 0, .48], target: [0, 0, 0], fov: 40 },
  { time: 56, position: [0, 0, .48], target: [0, 0, 0], fov: 40 },
  { time: 58, position: [0, 0, 5.5], target: [0, 0, 0], fov: 34 },
  { time: REFERENCE_DURATION, position: [0, 0, 5.5], target: [0, 0, 0], fov: 34 },
].map((frame) => Object.freeze({ ...frame, position: Object.freeze(frame.position), target: Object.freeze(frame.target) })));

export function evaluateCamera(referenceTime) {
  const time = clamp(referenceTime, 0, REFERENCE_DURATION);
  let index = 0;
  while (index < cameraKeyframes.length - 2 && time > cameraKeyframes[index + 1].time) index++;
  const from = cameraKeyframes[index], to = cameraKeyframes[index + 1];
  const t = smoothstep(range(time, from.time, to.time));
  const mix = (a, b) => t === 0 ? a : t === 1 ? b : a + (b - a) * t;
  return {
    position: from.position.map((a, i) => mix(a, to.position[i])),
    target: from.target.map((a, i) => mix(a, to.target[i])),
    fov: mix(from.fov, to.fov),
  };
}
