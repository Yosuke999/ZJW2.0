export const TRACK_TONES = ["product", "local", "china"];

export function getCarouselWindow(items, centerIndex, reverse = false) {
  const offsets = reverse ? [2, 1, 0, -1, -2] : [-2, -1, 0, 1, 2];
  return offsets.map((offset) => items[(centerIndex + offset + items.length) % items.length]);
}

export function getTrackShift(direction, tone) {
  return tone === "local" ? direction : direction * -1;
}

export function getTrackRole(slot, shift) {
  if (!shift) return slot === 2 ? "current" : "side";
  if (slot === 2) return "leaving";
  if ((shift === -1 && slot === 3) || (shift === 1 && slot === 1)) return "entering";
  return "side";
}

export function createTransitionGate() {
  let locked = false;
  return {
    isLocked: () => locked,
    tryLock: () => {
      if (locked) return false;
      locked = true;
      return true;
    },
    unlock: () => { locked = false; },
  };
}
