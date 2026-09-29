import { describe, expect, it } from "vitest";
import { computeDeviceStatus } from "./genieacs-device-status.js";

describe("computeDeviceStatus", () => {
  const now = new Date("2026-09-28T20:00:00.000Z");

  it("is online when the device checked in within its own interval window", () => {
    const lastInform = "2026-09-28T19:59:27.560Z"; // ~33s ago, interval 300s -> threshold 600s
    expect(computeDeviceStatus(lastInform, 300, now)).toEqual({ status: "online", lastInform });
  });

  it("is offline once the device has missed roughly two of its own check-ins", () => {
    const lastInform = "2026-09-28T19:49:00.000Z"; // 660s ago, interval 300s -> threshold 600s
    expect(computeDeviceStatus(lastInform, 300, now)).toEqual({ status: "offline", lastInform });
  });

  it("falls back to a 15-minute threshold when no PeriodicInformInterval is present", () => {
    const recentlyOnline = "2026-09-28T19:50:00.000Z"; // 10 min ago
    const stale = "2026-09-28T19:40:00.000Z"; // 20 min ago
    expect(computeDeviceStatus(recentlyOnline, undefined, now).status).toBe("online");
    expect(computeDeviceStatus(stale, undefined, now).status).toBe("offline");
  });
});
