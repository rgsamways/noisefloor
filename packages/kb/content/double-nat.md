---
id: double-nat
slug: double-nat
title: Double NAT
summary: More than one device translating addresses on the same path — breaks port forwarding, game consoles, VoIP, and VPNs even though browsing works fine.
category: nat-routing-service-layer
icon: network
aliases:
  - triple NAT
  - NAT layering
relatedFields:
  - nat.upstreamPresent
  - nat.customerSidePresent
---

## Technical

Double NAT occurs when more than one device on a path performs Network Address Translation — commonly a radio in router mode with NAT enabled, followed by the customer's own router also NATing. One layer of NAT (normally at the customer's router) is expected; a second layer breaks or degrades anything that depends on an accurate, externally-reachable address: port forwarding, strict NAT type detection on game consoles, one-way audio on VoIP calls, and unstable VPN connections.

The fix is always to ensure only one device NATs — typically switching the radio to bridge mode, or switching an extra router/mesh system to access-point mode.

## Layman

Imagine mail addressed to your house first goes through a re-addressing service, and then your own front desk re-addresses it again before it reaches you. Most of the time nobody notices, but anything that needs to know your real, direct address — like a delivery service confirming exactly where to knock — gets confused by the extra layer. That's exactly what happens to game consoles, video calls, and VPNs behind a double NAT.
