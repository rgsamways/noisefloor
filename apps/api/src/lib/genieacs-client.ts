import { env } from "../env.js";

// A TR-069 leaf parameter — GenieACS wraps every value in this envelope.
interface GenieAcsParam<T = string> {
  _object?: boolean;
  _timestamp?: string;
  _type?: string;
  _value?: T;
  _writable?: boolean;
}

// Typed for the fields the device-detail screen actually renders, but
// deliberately not a closed type — [key: string]: unknown preserves
// whatever else a given vendor/data-model reports (older TR-098
// InternetGatewayDevice.* trees, vendor extensions) so the raw passthrough
// never silently drops data the typed fields don't know about.
export interface GenieAcsDevice {
  _id: string;
  _deviceId?: {
    _Manufacturer?: string;
    _OUI?: string;
    _ProductClass?: string;
    _SerialNumber?: string;
  };
  _lastInform?: string;
  _lastBoot?: string;
  _lastBootstrap?: string;
  _registered?: string;
  Device?: {
    DeviceInfo?: {
      HardwareVersion?: GenieAcsParam;
      SoftwareVersion?: GenieAcsParam;
      ProvisioningCode?: GenieAcsParam;
    };
    ManagementServer?: {
      PeriodicInformEnable?: GenieAcsParam<boolean>;
      PeriodicInformInterval?: GenieAcsParam<number>;
      ConnectionRequestURL?: GenieAcsParam;
    };
    RootDataModelVersion?: GenieAcsParam;
  };
  [key: string]: unknown;
}

// Distinct from "device not found" (design.md's not-found-vs-unreachable
// decision) — a caller needs to tell "GenieACS is down" apart from
// "this device doesn't exist in GenieACS."
export class GenieAcsUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "GenieAcsUnavailableError";
  }
}

// GenieACS's NBI has no GET /devices/{id} for device data itself (only for
// tasks/tags sub-resources) — a single device is fetched via the same
// query-filtered list endpoint used for browsing all devices.
export async function fetchGenieAcsDevice(deviceId: string): Promise<GenieAcsDevice | null> {
  const query = encodeURIComponent(JSON.stringify({ _id: deviceId }));
  const url = `${env.GENIEACS_NBI_URL}/devices/?query=${query}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new GenieAcsUnavailableError(`Could not reach GenieACS NBI at ${env.GENIEACS_NBI_URL}`, cause);
  }

  if (!response.ok) {
    throw new GenieAcsUnavailableError(`GenieACS NBI returned ${response.status} for device lookup`);
  }

  const devices = (await response.json()) as GenieAcsDevice[];
  return devices[0] ?? null;
}
