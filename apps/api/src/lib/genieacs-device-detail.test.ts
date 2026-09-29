import { describe, expect, it } from "vitest";
import type { GenieAcsDevice } from "./genieacs-client.js";
import { toDeviceDetail } from "./genieacs-device-detail.js";

const now = new Date("2026-09-28T20:00:00.000Z");

const FULL_DEVICE: GenieAcsDevice = {
  _id: "E48D8C-hAP%20lite-8CE6085532C7",
  _deviceId: { _Manufacturer: "MikroTik", _OUI: "E48D8C", _ProductClass: "hAP lite", _SerialNumber: "8CE6085532C7" },
  _lastInform: "2026-09-28T19:59:27.560Z",
  _lastBoot: "2026-09-28T19:51:48.611Z",
  _lastBootstrap: "2026-09-28T19:51:48.611Z",
  _registered: "2026-09-28T19:51:48.611Z",
  Device: {
    DeviceInfo: {
      HardwareVersion: { _value: "v1.0" },
      SoftwareVersion: { _value: "6.49.18" },
      ProvisioningCode: { _value: "" },
    },
    ManagementServer: {
      PeriodicInformEnable: { _value: true },
      PeriodicInformInterval: { _value: 300 },
      ConnectionRequestURL: { _value: "http://192.168.88.1:7547/abc123" },
    },
    RootDataModelVersion: { _value: "2.11" },
  },
};

describe("toDeviceDetail", () => {
  it("extracts every typed field from a full device record", () => {
    const detail = toDeviceDetail(FULL_DEVICE, now);
    expect(detail).toMatchObject({
      id: "E48D8C-hAP%20lite-8CE6085532C7",
      manufacturer: "MikroTik",
      oui: "E48D8C",
      productClass: "hAP lite",
      serialNumber: "8CE6085532C7",
      hardwareVersion: "v1.0",
      softwareVersion: "6.49.18",
      provisioningCode: "",
      rootDataModelVersion: "2.11",
      lastBoot: "2026-09-28T19:51:48.611Z",
      lastBootstrap: "2026-09-28T19:51:48.611Z",
      registered: "2026-09-28T19:51:48.611Z",
      periodicInformEnabled: true,
      periodicInformIntervalSeconds: 300,
      connectionRequestUrl: "http://192.168.88.1:7547/abc123",
      status: "online",
      lastInform: "2026-09-28T19:59:27.560Z",
    });
  });

  it("includes the untouched raw device record", () => {
    const detail = toDeviceDetail(FULL_DEVICE, now);
    expect(detail.raw).toBe(FULL_DEVICE);
  });

  it("leaves typed fields undefined for a sparse device record, without throwing", () => {
    const sparse: GenieAcsDevice = { _id: "sparse-device", _lastInform: "2026-09-28T19:59:27.560Z" };
    const detail = toDeviceDetail(sparse, now);
    expect(detail.manufacturer).toBeUndefined();
    expect(detail.connectionRequestUrl).toBeUndefined();
    expect(detail.status).toBe("online");
  });

  it("reflects a stale device as offline", () => {
    const stale: GenieAcsDevice = { ...FULL_DEVICE, _lastInform: "2026-09-28T18:00:00.000Z" };
    const detail = toDeviceDetail(stale, now);
    expect(detail.status).toBe("offline");
  });
});
