---
id: channel-width
slug: channel-width
title: Channel width
summary: How much spectrum, in MHz, a radio link occupies to transmit — wider means more capacity but more exposure to interference.
category: frequency-spectrum
icon: sliders-horizontal
aliases:
  - bandwidth
  - channel bandwidth
relatedFields:
  - link.channelWidthMhz
---

## Technical

Channel width is how much spectrum, in MHz, a radio link occupies to transmit — common values include 20, 40, or 80 MHz. A wider channel carries more data per second (more capacity) but requires proportionally more clean spectrum and is more exposed to interference across that wider slice of the band; a narrower channel is more resilient in a crowded RF environment but caps the link's maximum throughput lower.

Changing channel width is a network-operations decision, not something a T1 tech adjusts per customer, since it affects every subscriber sharing that radio.

## Layman

This is how wide a "lane" the radio link uses on the airwaves. A wider lane can carry more traffic at once, but it's also more likely to pick up noise from neighboring lanes; a narrower lane is steadier but has a lower speed limit.
