---
id: chain-imbalance
slug: chain-imbalance
title: Chain imbalance
summary: The gap between a radio's two receive chains — a well-aimed link keeps them close, and a meaningful split is a strong tell for physical misalignment or a bad cable.
category: antennas-rf-hardware
icon: scale
aliases:
  - chain balance
  - polarization imbalance
relatedFields:
  - link.chainImbalanceDb
---

## Technical

Most modern radios use two receive/transmit chains — commonly separated by polarization (horizontal/vertical) — and report a signal level for each. On a well-aimed, healthy link, the two chains typically sit within a few dB of each other.

A meaningful split (roughly 5 dB or more) between chains is a strong secondary signature of physical misalignment: a dish that has rotated on its mount throws off polarization alignment and splits the chains apart, while a dish that has simply swung or tilted tends to drop both chains together. It's also the first place a bad cable or wet connector shows up, since a chain-specific hardware fault affects one chain's path but not the other's.

## Layman

Think of chain imbalance as checking whether both of a radio's two "ears" are hearing equally well. If one ear is noticeably worse than the other, something specific to that one path — a twisted dish, a bad connector — is the likely cause, rather than a general problem affecting the whole link equally.
