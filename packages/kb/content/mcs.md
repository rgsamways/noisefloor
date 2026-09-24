---
id: mcs
slug: mcs
title: MCS (Modulation and Coding Scheme)
summary: An index representing how a radio is currently encoding data — higher values pack in more throughput but need a cleaner signal to decode.
category: modulation-phy-capacity
icon: layers
aliases:
  - Modulation and Coding Scheme
  - modulation index
relatedFields:
  - link.modulationIndex
---

## Technical

MCS (Modulation and Coding Scheme) is an index representing a specific combination of modulation type (e.g. QPSK, 16-QAM, 256-QAM) and coding rate a radio is currently using to transmit. Higher MCS indexes pack more bits into each transmitted symbol and deliver higher throughput, but require proportionally higher SNR to decode reliably.

Radios adapt MCS automatically and continuously based on current link conditions — a radio stepping down through MCS values in real time, without dropping the link entirely, is the normal, healthy response to degrading SNR, not a fault by itself.

## Layman

This is the radio automatically choosing how "carefully" to speak based on how clear the connection is right now. On a great connection, it can speak quickly and pack in a lot of information. As conditions get worse, it slows down and simplifies to stay understood — the radio equivalent of switching from rapid conversation to speaking slowly and clearly.
