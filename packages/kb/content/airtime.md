---
id: airtime
slug: airtime
title: Airtime
summary: The share of available transmission time a radio actually spends sending or receiving — the field that explains "great signal but slow speeds."
category: modulation-phy-capacity
icon: clock
aliases:
  - airtime utilization
  - airtime fairness
relatedFields:
  - throughput.airtimePct
---

## Technical

Airtime is the share of available transmission time a radio (or a given client on a shared sector) actually spends transmitting or receiving, as a percentage. Because a sector radio serves multiple customers on the same channel, high airtime utilization from other subscribers — even with a customer's own signal and SNR both healthy — will show up as slow, inconsistent throughput.

This is the field that explains "great signal but slow speeds": capacity isn't just about signal strength, it's about how much of the shared channel is actually free to use.

## Layman

Imagine a single walkie-talkie channel shared by everyone in a building. Even if your own radio and hearing are perfect, if everyone else is talking constantly, you're stuck waiting for a gap to get your turn. Airtime is how much of that shared channel is already being used — high airtime means less room left for you, regardless of how good your own signal is.
