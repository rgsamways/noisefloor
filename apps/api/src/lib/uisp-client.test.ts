import { Agent } from "undici";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../env.js", () => ({
  env: { UISP_BASE_URL: "https://uisp.example.test", UISP_API_TOKEN: "test-token" },
}));

import { env } from "../env.js";
import { fetchUispDevice, UispNotConfiguredError, UispUnavailableError } from "./uisp-client.js";

describe("fetchUispDevice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    env.UISP_BASE_URL = "https://uisp.example.test";
    env.UISP_API_TOKEN = "test-token";
  });

  it("returns the device when UISP reports a match", async () => {
    const device = { identification: { id: "dev-1" }, overview: { status: "active" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => device }));

    const result = await fetchUispDevice("dev-1");
    expect(result).toEqual(device);
  });

  it("returns null when UISP reports the device is not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));

    const result = await fetchUispDevice("unknown-device");
    expect(result).toBeNull();
  });

  it("throws UispUnavailableError when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));

    await expect(fetchUispDevice("dev-1")).rejects.toBeInstanceOf(UispUnavailableError);
  });

  it("throws UispUnavailableError when UISP responds with a non-2xx, non-404 status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));

    await expect(fetchUispDevice("dev-1")).rejects.toBeInstanceOf(UispUnavailableError);
  });

  it("throws UispNotConfiguredError when UISP_BASE_URL/UISP_API_TOKEN are unset", async () => {
    env.UISP_BASE_URL = undefined;
    env.UISP_API_TOKEN = undefined;

    await expect(fetchUispDevice("dev-1")).rejects.toBeInstanceOf(UispNotConfiguredError);
  });

  it("passes an undici Agent as the dispatcher, for self-signed-cert tolerance", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchUispDevice("dev-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0]!;
    expect(options.dispatcher).toBeInstanceOf(Agent);
  });

  it("sends the x-auth-token header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchUispDevice("dev-1");

    const [, options] = fetchMock.mock.calls[0]!;
    expect(options.headers).toEqual({ "x-auth-token": "test-token" });
  });
});
