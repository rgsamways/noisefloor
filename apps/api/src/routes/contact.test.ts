import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("POST /contact", () => {
  it("accepts a valid submission", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: { name: "Jamie", email: "jamie@example.com", message: "Found a bug in the console." },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("rejects a missing message", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: { name: "Jamie", email: "jamie@example.com", message: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: { name: "Jamie", email: "not-an-email", message: "Hello" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("reports success without erroring when the honeypot is filled", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: { name: "Bot", email: "bot@example.com", message: "spam", website: "http://spam.example" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
