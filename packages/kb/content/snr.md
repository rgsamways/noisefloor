---
id: snr
slug: snr
title: SNR (Signal-to-Noise Ratio)
summary: How much stronger the wanted signal is than the background noise, in decibels — the single number that best predicts whether a link will hold a fast, stable connection.
category: rf-fundamentals
icon: waves
aliases:
  - Signal-to-Noise Ratio
  - signal-to-noise ratio
  - signal to noise ratio
relatedFields:
  - link.snrDb
---

## Technical

SNR is signal level (dBm) minus noise floor (dBm), expressed in dB. Because dBm is a logarithmic scale, SNR isn't a raw-power ratio you compute by dividing — it's a subtraction of two dB figures. A link with -60 dBm signal and a -92 dBm noise floor has 32 dB of SNR.

Modulation and coding schemes (MCS) require a minimum SNR to run reliably: higher-order modulations like 256-QAM need significantly more SNR headroom than a robust fallback like 16-QAM, so as SNR drops, a radio steps down to a more robust (slower) MCS to keep the link connected rather than failing outright.

SNR can drop for two independent reasons a tech has to distinguish: the signal getting weaker (misalignment, rain fade, foliage) or the noise floor rising (interference). Both lower the same number, but only one of them means the customer's antenna moved.

## Layman

Think of SNR as how well you can hear someone talking at a noisy party. A high SNR means their voice is way louder than the background chatter — easy to understand. A low SNR means their voice and the noise are close in volume, and you start missing words.

A radio link works the same way: good SNR means fast, reliable data. As SNR drops, the link slows down to stay connected — the radio equivalent of asking someone to repeat themselves more simply rather than losing the conversation entirely.
