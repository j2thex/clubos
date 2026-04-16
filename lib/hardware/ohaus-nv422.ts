// Ohaus Navigator NV422 driver, talking over Web Serial.
//
// The NV422 exposes an RS-232 port; with the Ohaus USB interface kit it
// enumerates as a USB-serial device that Chrome/Edge can reach through
// navigator.serial.requestPort(). Default port settings match the unit's
// out-of-the-box config (9600 8-N-1, no flow control).
//
// Print output formats the NV422 can emit (per Ohaus manual):
//   "    1.23 g\r\n"            // stable, positive
//   "   -1.23 g\r\n"            // negative
//   "    1.23 g ?  \r\n"        // unstable marker sometimes appended
// The driver is forgiving: it extracts the first signed decimal followed
// by a unit token (g/kg/oz) and flags unstable when a "?" follows.

import type { ScaleAdapter, ScaleReading } from "./scale";

const LINE_REGEX = /([+-]?\s*\d+(?:\.\d+)?)\s*(kg|g|oz|lb)/i;

function toGrams(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "kg") return value * 1000;
  if (u === "oz") return value * 28.3495;
  if (u === "lb") return value * 453.592;
  return value; // g
}

export function parseOhausLine(line: string): ScaleReading | null {
  const match = line.match(LINE_REGEX);
  if (!match) return null;
  const raw = line.trim();
  const value = Number(match[1].replace(/\s/g, ""));
  if (!Number.isFinite(value)) return null;
  const grams = toGrams(value, match[2]);
  const stable = !raw.includes("?");
  return {
    weightGrams: Math.round(grams * 100) / 100,
    stable,
    raw,
  };
}

export class OhausNV422Adapter implements ScaleAdapter {
  readonly label = "Ohaus NV422";
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private listeners = new Set<(r: ScaleReading) => void>();
  private running = false;

  async connect(): Promise<void> {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial is not supported in this browser");
    }
    // Prompts the user to pick a serial device. Requires a user gesture.
    const port = await (navigator as Navigator & {
      serial: {
        requestPort: (opts?: unknown) => Promise<SerialPort>;
      };
    }).serial.requestPort();
    await port.open({
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      flowControl: "none",
    });
    this.port = port;
    this.running = true;
    void this.readLoop();
  }

  async disconnect(): Promise<void> {
    this.running = false;
    try {
      await this.reader?.cancel();
    } catch {
      // ignore
    }
    try {
      await this.port?.close();
    } catch {
      // ignore
    }
    this.reader = null;
    this.port = null;
  }

  onReading(cb: (r: ScaleReading) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private async readLoop(): Promise<void> {
    if (!this.port?.readable) return;

    // Decode bytes → text, then split on CR/LF into lines.
    const textDecoder = new TextDecoderStream();
    // The port exposes ReadableStream<Uint8Array>; TextDecoderStream.writable
    // is typed as WritableStream<BufferSource> in the DOM lib. Variance makes
    // TS reject the direct pipe, but at runtime both sides speak Uint8Array.
    const writable = textDecoder.writable as unknown as WritableStream<Uint8Array>;
    const readableStreamClosed = this.port.readable.pipeTo(writable).catch(() => {});
    const reader = textDecoder.readable.getReader();
    this.reader = reader;

    let buffer = "";
    try {
      while (this.running) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += value;
        const parts = buffer.split(/\r\n|\r|\n/);
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part) continue;
          const reading = parseOhausLine(part);
          if (reading) {
            this.listeners.forEach((cb) => cb(reading));
          }
        }
      }
    } catch {
      // Serial read failed — likely device disconnect. Swallow and exit.
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
      await readableStreamClosed;
    }
  }
}

// Minimal Web Serial types (the project doesn't depend on a full polyfill).
// Only what this driver touches is declared.
interface SerialPort {
  readable: ReadableStream<Uint8Array> | null;
  open(options: {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    flowControl?: "none" | "hardware";
  }): Promise<void>;
  close(): Promise<void>;
}
