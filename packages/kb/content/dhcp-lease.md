---
id: dhcp-lease
slug: dhcp-lease
title: DHCP lease
summary: A temporary IP address assignment that a device has to renew before it expires — an expired, un-renewed lease usually means the device stopped asking.
category: nat-routing-service-layer
icon: key
aliases:
  - Dynamic Host Configuration Protocol
  - DHCP
  - IP lease
relatedFields:
  - dhcpLease.present
---

## Technical

A DHCP lease is the temporary assignment of an IP address to a device, issued by a DHCP server for a fixed duration (commonly 24 hours on this network) and renewed automatically before it expires. A device with no valid lease — either it never successfully requested one, or a prior lease expired without renewal — typically falls back to a self-assigned, non-routable address.

Distinguishing "expired and never renewed" from "device never got a lease at all" matters diagnostically: the former suggests a device that stopped renewing (a hung process, a WAN issue at the time of renewal), while the latter often points at a boot-order problem or a genuinely offline device.

## Layman

This is like a parking permit for an IP address — a device borrows one for a set period of time and is supposed to ask for a new one before the old one runs out. If a device's lease has expired and it never asked for a new one, it's effectively lost its parking spot and has nowhere valid to park, which usually means the internet won't work for it until it renews.
