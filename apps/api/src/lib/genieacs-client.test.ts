import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGenieAcsDevice, GenieAcsUnavailableError } from "./genieacs-client.js";

describe("fetchGenieAcsDevice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the device when GenieACS reports a match", async () => {
    const device = { _id: "E48D8C-hAP%20lite-8CE6085532C7", _lastInform: "2026-09-28T19:59:27.560Z" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [device] }),
    );

    const result = await fetchGenieAcsDevice(device._id);
    expect(result).toEqual(device);
  });

  it("returns null when GenieACS reports no matching device", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );

    const result = await fetchGenieAcsDevice("unknown-device-id");
    expect(result).toBeNull();
  });

  it("throws GenieAcsUnavailableError when the request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
    );

    await expect(fetchGenieAcsDevice("some-device-id")).rejects.toBeInstanceOf(GenieAcsUnavailableError);
  });

  it("throws GenieAcsUnavailableError when GenieACS responds with a non-2xx status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    await expect(fetchGenieAcsDevice("some-device-id")).rejects.toBeInstanceOf(GenieAcsUnavailableError);
  });
});
