---
id: boot-order
slug: boot-order
title: Boot order
summary: The sequence devices come back online after a power event — a router that asks for its address too early can get stuck offline even once everything is powered.
category: operations-process
icon: power
aliases:
  - restart order
  - power-on sequence
relatedFields:
  - radioHealth.uptimeSeconds
---

## Technical

Boot order refers to the sequence and timing in which a customer's devices — radio, router, mesh nodes, switches — come back online after a power event. A consumer router often boots faster than an outdoor radio, which also needs time to reassociate with the tower; if the router requests its WAN address before the radio has a path upstream, it can give up, self-assign a non-routable address, or wait an unexpectedly long time before retrying.

The signature is a radio that reads perfectly healthy while the router's own address/lease never recovered — the fix is restarting devices in a deliberate order (radio first, then router, then downstream devices), not troubleshooting either device's configuration.

## Layman

After a power outage, your devices don't all wake up at the same speed — the outdoor radio can take a minute or two to reconnect to the tower, but a home router might be ready to ask for internet access well before that. If the router asks too early and gets no answer, it can just give up instead of trying again, leaving you offline even though everything is technically powered on. Restarting things in the right order — radio first, router second — usually fixes it.
