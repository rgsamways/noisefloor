import { describe, expect, it } from "vitest";
import { chainImbalanceToSeverity } from "./severity.js";

describe("chainImbalanceToSeverity", () => {
  it("is good for a small, healthy imbalance", () => {
    expect(chainImbalanceToSeverity(1)).toBe("good");
  });

  it("is ok just past the first threshold", () => {
    expect(chainImbalanceToSeverity(3)).toBe("ok");
  });

  it("is warn at the field-confirmed ~5dB alignment-problem threshold", () => {
    expect(chainImbalanceToSeverity(5)).toBe("warn");
    expect(chainImbalanceToSeverity(6)).toBe("warn");
  });

  it("is bad for a severe imbalance", () => {
    expect(chainImbalanceToSeverity(8)).toBe("bad");
  });

  it("judges by magnitude, not sign", () => {
    expect(chainImbalanceToSeverity(-6)).toBe("warn");
  });
});
