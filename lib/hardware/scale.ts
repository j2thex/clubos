// Scale adapter abstraction.
// Concrete implementations (e.g. Ohaus NV422 via Web Serial) live alongside.
// The POS component talks only to this interface so the driver is swappable.

export type ScaleReading = {
  /** Weight in grams. Negative allowed (when tared). */
  weightGrams: number;
  /** True when the scale marked the reading as stable. */
  stable: boolean;
  /** Raw line from the device, kept for audit (stored on the transaction). */
  raw: string;
};

export interface ScaleAdapter {
  readonly label: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  /**
   * Subscribe to weight readings. Returns an unsubscribe function.
   * Multiple subscribers are allowed.
   */
  onReading(cb: (r: ScaleReading) => void): () => void;
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

// Acceptable absolute deviation between a requested target weight and the
// actual scale reading, in grams. Same value enforced server-side in the
// record_sale RPC.
export const WEIGHT_TOLERANCE_G = 0.05;

export function isWithinTolerance(actual: number, requested: number): boolean {
  return Math.abs(actual - requested) <= WEIGHT_TOLERANCE_G;
}
