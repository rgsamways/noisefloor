import type { UispDevice } from "./uisp-client.js";

export interface UispDeviceDetail {
  id?: string;
  name?: string;
  model?: string;
  // UISP reports its own status string directly (unlike GenieACS, which has
  // no such field and needs one derived from _lastInform) — passed through
  // as-is, not recomputed.
  status?: string;
  frequency?: number;
  channelWidth?: number;
  signal?: number;
  signal2?: number;
  transmitPower?: number;
  transmitEirp?: number;
  uptimeSeconds?: number;
  cpu?: number;
  ram?: number;
  // The untouched device record — same "exposing everything the API
  // provides" reasoning as GenieAcsDeviceDetail.raw.
  raw: UispDevice;
}

export function toUispDeviceDetail(device: UispDevice): UispDeviceDetail {
  const wirelessInterface = device.interfaces?.find((iface) => iface.wireless);

  return {
    id: device.identification?.id,
    name: device.identification?.name,
    model: device.identification?.model,
    status: device.overview?.status,
    frequency: device.overview?.frequency,
    channelWidth: device.overview?.channelWidth,
    signal: device.overview?.signal,
    signal2: device.overview?.signal2,
    transmitPower: device.overview?.transmitPower,
    transmitEirp: wirelessInterface?.wireless?.transmitEirp,
    uptimeSeconds: device.overview?.uptime,
    cpu: device.overview?.cpu,
    ram: device.overview?.ram,
    raw: device,
  };
}
