export const TRACK_TONES = ["product", "local", "china"];

export function getCarouselWindow(items, centerIndex, reverse = false) {
  const offsets = reverse ? [2, 1, 0, -1, -2] : [-2, -1, 0, 1, 2];
  return offsets.map((offset) => items[(centerIndex + offset + items.length) % items.length]);
}

export function getTrackShift(direction, tone) {
  return tone === "local" ? direction : direction * -1;
}
