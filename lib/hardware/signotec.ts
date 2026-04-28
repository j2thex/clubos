// Signotec signoPAD-API/Web bridge driver.
//
// Talks to the local WebSocket Pad Server (default install path) running on
// the staff workstation. The vendored SDK is loaded lazily on first use so it
// doesn't bloat the initial bundle.
//
// Standard endpoint: wss://local.signotecwebsocket.de:49494 — public DNS
// resolves to 127.0.0.1 + signotec ships a hosts entry on install, which keeps
// the TLS cert valid from any https:// page.

"use client";

const SDK_URL = "/vendor/signotec/STPadServerLib-3.5.0.js";
const WS_URL = "wss://local.signotecwebsocket.de:49494";

type Sdk = {
  STPadServerLibCommons: SignotecCommons;
  STPadServerLibDefault: SignotecDefaultApi;
  STPadServerLibApi: unknown;
};

type SignotecCommons = {
  createConnection: (
    url: string,
    onOpen: (evt: Event) => void,
    onClose: (evt: Event) => void,
    onError: (evt: Event) => void,
  ) => void;
  destroyConnection: () => void;
  getServerVersion: () => Promise<{ version: string }>;
  handleDisconnect: (index: unknown) => void;
};

type SignotecDefaultApi = {
  Params: {
    searchForPads: new () => { setPadSubset?: (subset: unknown) => void };
    openPad: new (index: number) => unknown;
    closePad: new (index: number) => unknown;
    startSignature: new () => {
      setFieldName: (name: string) => void;
      setCustomText: (text: string) => void;
      setConfirmationText: (text: string) => void;
    };
    getSignatureImage: new () => {
      setFileType: (type: unknown) => void;
      setPenWidth: (px: number) => void;
    };
  };
  FileType: { PNG: unknown };
  searchForPads: (params: unknown) => Promise<{
    foundPads: Array<{ type: unknown; serialNumber: string; firmwareVersion: string }>;
  }>;
  openPad: (params: unknown) => Promise<{
    padInfo: { displayWidth: number; displayHeight: number; samplingRate: number };
  }>;
  closePad: (params: unknown) => Promise<unknown>;
  startSignature: (params: unknown) => Promise<unknown>;
  cancelSignature: () => Promise<unknown>;
  retrySignature: () => Promise<unknown>;
  confirmSignature: () => Promise<{ countedPoints?: number }>;
  getSignatureImage: (params: unknown) => Promise<{ file: string }>;
  handleConfirmSignature: () => void;
  handleCancelSignature: () => void;
  handleRetrySignature: () => void;
};

declare global {
  interface Window {
    STPadServerLib?: Sdk;
  }
}

let sdkPromise: Promise<Sdk> | null = null;

function loadSdk(): Promise<Sdk> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Signotec bridge requires a browser"));
  }
  if (window.STPadServerLib) return Promise.resolve(window.STPadServerLib);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<Sdk>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_URL}"]`,
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      const sdk = window.STPadServerLib;
      if (!sdk) {
        reject(new Error("Signotec SDK loaded but window.STPadServerLib is missing"));
        return;
      }
      resolve(sdk);
    };
    const onError = () => reject(new Error("Failed to load Signotec SDK"));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return sdkPromise;
}

export type CaptureHandle = {
  promise: Promise<File>;
  cancel: () => Promise<void>;
};

export type CaptureOptions = {
  fieldName?: string;
  customText?: string;
  confirmationText?: string;
  connectTimeoutMs?: number;
};

// Open the bridge connection, search for a pad, start signature capture, and
// resolve with a PNG File once the member presses Confirm on the device.
//
// Throws if: the SDK can't load, the bridge connection times out, no pad is
// found, or the member presses Cancel on the device.
export async function captureSignature(opts: CaptureOptions = {}): Promise<CaptureHandle> {
  const sdk = await loadSdk();
  const Commons = sdk.STPadServerLibCommons;
  const Api = sdk.STPadServerLibDefault;

  const connectTimeoutMs = opts.connectTimeoutMs ?? 4000;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        Commons.destroyConnection();
      } catch {
        // ignore — connection may not be created yet
      }
      reject(new Error("Signotec bridge connect timed out"));
    }, connectTimeoutMs);
    Commons.createConnection(
      WS_URL,
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve();
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(new Error("Signotec bridge closed before opening"));
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(new Error("Signotec bridge connection error"));
      },
    );
  });

  const padIndex = 0;
  let padOpened = false;

  const cleanup = async () => {
    try {
      if (padOpened) {
        const closeParams = new Api.Params.closePad(padIndex);
        await Api.closePad(closeParams).catch(() => {});
        padOpened = false;
      }
    } finally {
      try {
        Commons.destroyConnection();
      } catch {
        // ignore
      }
    }
  };

  const promise: Promise<File> = (async () => {
    try {
      const searchParams = new Api.Params.searchForPads();
      const pads = await Api.searchForPads(searchParams);
      if (!pads.foundPads || pads.foundPads.length === 0) {
        throw new Error("No signature pad connected");
      }

      const openParams = new Api.Params.openPad(padIndex);
      await Api.openPad(openParams);
      padOpened = true;

      // Wire up confirm/cancel handlers BEFORE startSignature so we don't miss events.
      const outcome = await new Promise<"confirmed" | "cancelled">((resolve) => {
        Api.handleConfirmSignature = () => resolve("confirmed");
        Api.handleCancelSignature = () => resolve("cancelled");
        Api.handleRetrySignature = () => {
          // Pad-side retry just clears the pad — bridge handles redraw. No-op for us.
        };

        const startParams = new Api.Params.startSignature();
        startParams.setFieldName(opts.fieldName ?? "Member signature");
        startParams.setCustomText(opts.customText ?? "");
        startParams.setConfirmationText(opts.confirmationText ?? "");
        Api.startSignature(startParams).catch(() => resolve("cancelled"));
      });

      if (outcome === "cancelled") {
        throw new Error("Member cancelled signature on pad");
      }

      await Api.confirmSignature();

      const imgParams = new Api.Params.getSignatureImage();
      imgParams.setFileType(Api.FileType.PNG);
      imgParams.setPenWidth(5);
      const imgResult = await Api.getSignatureImage(imgParams);

      const bytes = atob(imgResult.file);
      const buf = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
      return new File([buf], `signature-${Date.now()}.png`, { type: "image/png" });
    } finally {
      await cleanup();
    }
  })();

  const cancel = async () => {
    try {
      await Api.cancelSignature();
    } catch {
      // ignore — connection may already be torn down
    }
    await cleanup();
  };

  return { promise, cancel };
}
