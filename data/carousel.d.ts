export type TrackTone = "product" | "local" | "china";
export declare function getCarouselWindow<T>(items: T[], centerIndex: number, reverse?: boolean): T[];
export declare function getTrackShift(direction: 1 | -1, tone: TrackTone): 1 | -1;
