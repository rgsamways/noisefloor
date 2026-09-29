import type { GenieAcsDevice } from "./genieacs-client.js";
import { computeDeviceStatus, type GenieAcsDeviceStatus } from "./genieacs-device-status.js";

export interface GenieAcsDeviceDetail extends GenieAcsDeviceStatus {
  id: string;
  manufacturer?: string;
  oui?: string;
  productClass?: string;
  serialNumber?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  provisioningCode?: string;
  rootDataModelVersion?: string;
  lastBoot?: string;
  lastBootstrap?: string;
  registered?: string;
  periodicInformEnabled?: boolean;
  periodicInformIntervalSeconds?: number;
  connectionRequestUrl?: string;
  // The untouched device record — "exposing everything the API
  // provides" means the curated fields above never have to be the only
  // way to see a value; anything the typed fields don't cover is still
  // here for a raw/advanced view.
  raw: GenieAcsDevice;
}

// A device with no _lastInform at all is treated as not-found by the
// caller (genieacs.ts) before this is ever called — computeDeviceStatus
// always has a real timestamp to work with here.
export function toDeviceDetail(device: GenieAcsDevice, now: Date = new Date()): GenieAcsDeviceDetail {
  const periodicInformIntervalSeconds = device.Device?.ManagementServer?.PeriodicInformInterval?._value;
  const { status } = computeDeviceStatus(device._lastInform!, periodicInformIntervalSeconds, now);

  return {
    id: device._id,
    status,
    lastInform: device._lastInform!,
    manufacturer: device._deviceId?._Manufacturer,
    oui: device._deviceId?._OUI,
    productClass: device._deviceId?._ProductClass,
    serialNumber: device._deviceId?._SerialNumber,
    hardwareVersion: device.Device?.DeviceInfo?.HardwareVersion?._value,
    softwareVersion: device.Device?.DeviceInfo?.SoftwareVersion?._value,
    provisioningCode: device.Device?.DeviceInfo?.ProvisioningCode?._value,
    rootDataModelVersion: device.Device?.RootDataModelVersion?._value,
    lastBoot: device._lastBoot,
    lastBootstrap: device._lastBootstrap,
    registered: device._registered,
    periodicInformEnabled: device.Device?.ManagementServer?.PeriodicInformEnable?._value,
    periodicInformIntervalSeconds,
    connectionRequestUrl: device.Device?.ManagementServer?.ConnectionRequestURL?._value,
    raw: device,
  };
}
