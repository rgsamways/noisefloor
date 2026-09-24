import { describe, expect, it } from "vitest";
import { VALID_RELATED_FIELD_PATHS, isValidRelatedField } from "./related-fields.js";

describe("VALID_RELATED_FIELD_PATHS", () => {
  it("includes known RadioLinkTelemetry fields", () => {
    expect(isValidRelatedField("link.snrDb")).toBe(true);
    expect(isValidRelatedField("throughput.airtimePct")).toBe(true);
    expect(isValidRelatedField("farEnd.packetLossPct")).toBe(true);
  });

  it("includes known ServiceLayerTelemetry fields", () => {
    expect(isValidRelatedField("dhcpLease.present")).toBe(true);
    expect(isValidRelatedField("lanPort.crcErrorCount")).toBe(true);
  });

  it("rejects an unresolvable field path", () => {
    expect(isValidRelatedField("link.notARealField")).toBe(false);
    expect(isValidRelatedField("notARealGroup.snrDb")).toBe(false);
  });

  it("rejects a flat field name without its group prefix", () => {
    expect(isValidRelatedField("snrDb")).toBe(false);
  });

  it("excludes vendorExtras, which has no fixed field set", () => {
    const vendorExtrasPaths = [...VALID_RELATED_FIELD_PATHS].filter((p) => p.startsWith("vendorExtras."));
    expect(vendorExtrasPaths).toEqual([]);
  });
});
