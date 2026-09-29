import { describe, expect, it } from "vitest";
import { toUispDeviceDetail } from "./uisp-device-detail.js";
import type { UispDevice } from "./uisp-client.js";

describe("toUispDeviceDetail", () => {
  it("extracts identity, status, and readings from a full record", () => {
    const device: UispDevice = {
      identification: { id: "dev-1", name: "NanoBeam AC", model: "NBE-5AC-19" },
      overview: {
        status: "active",
        frequency: 5745,
        channelWidth: 40,
        signal: -58,
        signal2: -60,
        transmitPower: 20,
        uptime: 123456,
        cpu: 12,
        ram: 34,
      },
      interfaces: [{ wireless: { transmitEirp: 27 } }],
    };

    expect(toUispDeviceDetail(device)).toEqual({
      id: "dev-1",
      name: "NanoBeam AC",
      model: "NBE-5AC-19",
      status: "active",
      frequency: 5745,
      channelWidth: 40,
      signal: -58,
      signal2: -60,
      transmitPower: 20,
      transmitEirp: 27,
      uptimeSeconds: 123456,
      cpu: 12,
      ram: 34,
      raw: device,
    });
  });

  it("leaves fields undefined for a sparse record instead of throwing", () => {
    const device: UispDevice = {};

    expect(toUispDeviceDetail(device)).toEqual({
      id: undefined,
      name: undefined,
      model: undefined,
      status: undefined,
      frequency: undefined,
      channelWidth: undefined,
      signal: undefined,
      signal2: undefined,
      transmitPower: undefined,
      transmitEirp: undefined,
      uptimeSeconds: undefined,
      cpu: undefined,
      ram: undefined,
      raw: device,
    });
  });
});
