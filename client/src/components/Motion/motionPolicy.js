// These controls keep native input/scroll semantics. No smoothing over canvas,
// forms, chat, map camera gestures or modal/nested scroll regions.
export const nativeScrollSelector='input,textarea,select,[contenteditable="true"],form,[data-lenis-prevent],.body-measurements,.sketch-workspace,.voice-workspace,.beatle-root,.dialog-backdrop,.india-map-viewport,.atelier-experience,.collection-thumbnails';
export const choreographyExcluded='.beatle-root,.dialog-backdrop,.body-measurements,.sketch-workspace,.voice-workspace,.cinematic-intro,.campaign-brand,[data-react-bits]';
export function storyPinDistance(sectionHeight,asideHeight) {if(!Number.isFinite(sectionHeight)||!Number.isFinite(asideHeight)||sectionHeight<=0||asideHeight<=0)return 0;return Math.max(0,Math.min(280,sectionHeight-asideHeight-48));}
