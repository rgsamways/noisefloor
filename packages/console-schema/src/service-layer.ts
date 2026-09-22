import { z } from "zod";
import { readingSchema } from "./reading.js";

// A separate top-level shape from RadioLinkTelemetry, matching handoff
// §3's "two panels, not one" framing: DHCP lease, addressing, NAT, and
// LAN-port link state (§5) live under the radio link, not inside it — a
// bad reading here isn't a radio problem, and the console should be able
// to say so.

export const DhcpLeaseGroupSchema = z.object({
  present: readingSchema(z.boolean()),
  issuedAt: readingSchema(z.iso.datetime()),
  remainingSeconds: readingSchema(z.number().nonnegative()),
  leaseAddress: readingSchema(z.string()),
  expectedAddress: readingSchema(z.string()),
});
export type DhcpLeaseGroup = z.infer<typeof DhcpLeaseGroupSchema>;

export const AddressingGroupSchema = z.object({
  managementIp: readingSchema(z.string()),
  gateway: readingSchema(z.string()),
  wanAddress: readingSchema(z.string()),
});
export type AddressingGroup = z.infer<typeof AddressingGroupSchema>;

export const NatGroupSchema = z.object({
  upstreamPresent: readingSchema(z.boolean()),
  customerSidePresent: readingSchema(z.boolean()),
});
export type NatGroup = z.infer<typeof NatGroupSchema>;

// Physical-layer link state, distinct from addressing's IP-layer
// configuration — is the radio seeing an active Ethernet link on its
// LAN-facing port. Nearly universal on real radio hardware, and the
// signal that would actually change if a genuinely separate downstream
// customer router lost power (handoff §5's "customer router offline").
export const LanPortGroupSchema = z.object({
  linkUp: readingSchema(z.boolean()),
});
export type LanPortGroup = z.infer<typeof LanPortGroupSchema>;

export const ServiceLayerTelemetrySchema = z.object({
  dhcpLease: DhcpLeaseGroupSchema,
  addressing: AddressingGroupSchema,
  nat: NatGroupSchema,
  lanPort: LanPortGroupSchema,
});
export type ServiceLayerTelemetry = z.infer<typeof ServiceLayerTelemetrySchema>;
