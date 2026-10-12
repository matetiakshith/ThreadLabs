// A pinned upper edge, gravity-shaped folds and a soft pointer disturbance.
// This is a procedural material study, not a physical tailoring simulation.
export function drapeVertex(x, y, time = 0, pointerX = 0, pointerY = 0) {
  const hanging = Math.max(0, Math.min(1, (1.425 - y) / 2.85));
  const folds = Math.sin(x * 7.2 + hanging * .8) * (.09 + hanging * .12);
  const breeze = Math.sin(x * 3.1 + time * 2) * Math.sin(hanging * 2.2) * .075;
  const distance = (x - pointerX * 1.25) ** 2 + (y - pointerY * 1.4) ** 2;
  const touch = Math.exp(-distance * 3) * .13 * hanging * Math.min(1, Math.abs(pointerX) + Math.abs(pointerY));
  return { x: x * (1 - hanging * .06), y: y - Math.cos(x * 1.15) * .2 * (1 - hanging), z: folds + breeze + touch };
}
