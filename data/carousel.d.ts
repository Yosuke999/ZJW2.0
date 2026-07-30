export type TrackTone = "product" | "local" | "china";
export declare function getCarouselWindow<T>(items: T[], centerIndex: number, reverse?: boolean): T[];
export declare function getTrackShift(direction: 1 | -1, tone: TrackTone): 1 | -1;
export type TrackRole = "current" | "side" | "leaving" | "entering";
export declare function getTrackRole(slot: number, shift: 1 | -1 | 0): TrackRole;
export declare function createTransitionGate(): { isLocked(): boolean; tryLock(): boolean; unlock(): void };
