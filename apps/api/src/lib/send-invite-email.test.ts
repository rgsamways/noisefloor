import { describe, expect, it, vi } from "vitest";
import { sendInviteEmail } from "./send-invite-email.js";

describe("sendInviteEmail", () => {
  it("logs to the console instead of calling Resend when RESEND_API_KEY is unset", async () => {
    // No RESEND_API_KEY in this test environment (see .env/.env.test) —
    // confirms the fallback fires rather than making a real network call.
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await sendInviteEmail({ email: "someone@example.com", groupName: "Support" });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("someone@example.com"));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Support"));
    } finally {
      logSpy.mockRestore();
    }
  });
});
