import { Agent } from "undici";
import { env } from "../env.js";

// UISP splits device detail by hardware family — only airMax is confirmed
// relevant to NRN's fleet so far (add-customer-snapshot design.md's
// Decision on device-family dispatch). Typed loosely with an index
// signature, same reasoning as GenieAcsDevice: preserve whatever else a
// given device actually reports rather than silently dropping it.
export interface UispDevice {
  identification?: {
    id?: string;
    name?: string;
    model?: string;
  };
  overview?: {
    status?: string;
    frequency?: number;
    channelWidth?: number;
    signal?: number;
    signal2?: number;
    transmitPower?: number;
    uptime?: number;
    cpu?: number;
    ram?: number;
  };
  interfaces?: Array<{ wireless?: { transmitEirp?: number } }>;
  [key: string]: unknown;
}

// Distinct from "device not found" — a caller needs to tell "UISP is
// down" apart from "this device doesn't exist in UISP," mirroring
// GenieAcsUnavailableError exactly.
export class UispUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "UispUnavailableError";
  }
}

// Thrown for a genuine misconfiguration (missing env), not a request
// failure — distinct from UispUnavailableError so a caller doesn't
// mistake "nobody set up UISP yet" for "UISP is temporarily down."
export class UispNotConfiguredError extends Error {
  constructor() {
    super("UISP_BASE_URL/UISP_API_TOKEN are not configured");
    this.name = "UispNotConfiguredError";
  }
}

// UISP self-hosted instances run self-signed certs by default — a
// per-request dispatcher, not the global NODE_TLS_REJECT_UNAUTHORIZED env
// var, so this only weakens cert checking for UISP calls specifically
// (add-customer-snapshot design.md's Decision).
const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

// Only airMax is confirmed relevant to NRN's fleet so far — add more
// families here as they're actually needed, not speculatively.
export async function fetchUispDevice(deviceId: string): Promise<UispDevice | null> {
  if (!env.UISP_BASE_URL || !env.UISP_API_TOKEN) {
    throw new UispNotConfiguredError();
  }

  const url = `${env.UISP_BASE_URL}/nms/api/v2.1/devices/airmaxes/${encodeURIComponent(deviceId)}`;

  let response: Response;
  try {
    // Global fetch's TypeScript types (Node's bundled undici-types) and
    // the standalone `undici` package's own Agent type disagree with
    // each other despite both being real, compatible undici at runtime —
    // a known cross-version type-definition clash, not a real type
    // error. Cast through `unknown` rather than fighting it; kept on
    // global fetch (not undici's own fetch export) so this stays mockable
    // via vi.stubGlobal("fetch", ...) the same way genieacs-client.ts is.
    response = await fetch(url, {
      headers: { "x-auth-token": env.UISP_API_TOKEN },
      dispatcher: insecureDispatcher,
    } as unknown as RequestInit);
  } catch (cause) {
    throw new UispUnavailableError(`Could not reach UISP at ${env.UISP_BASE_URL}`, cause);
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new UispUnavailableError(`UISP returned ${response.status} for device lookup`);
  }

  return (await response.json()) as UispDevice;
}
