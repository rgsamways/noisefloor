---
id: noise-floor
slug: noise-floor
title: Noise floor
summary: The level of background RF energy present on a channel even with no wanted signal — the other half of the SNR calculation, and the tell for interference.
category: rf-fundamentals
icon: audio-lines
aliases:
  - background noise
  - RF noise floor
relatedFields:
  - link.noiseFloorDbm
---

## Technical

The noise floor is the level of background RF energy present on a channel with no wanted signal at all — thermal noise plus whatever unwanted energy (other radios, electrical interference) happens to occupy that frequency. On a clean 20 MHz channel at 5 GHz, a typical noise floor sits around -90 to -95 dBm; anything sitting noticeably higher than that baseline — say -80 dBm or worse — means something is filling the channel.

The noise floor is the second half of the SNR calculation, and it's what separates interference (noise rises, signal stays put) from every signal-based fault like misalignment, rain fade, or foliage (signal drops, noise floor stays flat).

## Layman

This is how "noisy" a radio channel is even before anyone's actual signal shows up — like the general hum and chatter in a room before anyone starts talking. A quiet room makes it easy to hear a quiet voice; a loud room drowns it out even if the voice itself hasn't changed.

If a customer's connection gets choppy and the noise floor has crept up while their actual signal looks the same as always, the problem is something adding noise nearby — not their dish moving.
