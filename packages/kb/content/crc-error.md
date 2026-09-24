---
id: crc-error
slug: crc-error
title: CRC error
summary: A count of corrupted Ethernet frames that had to be thrown away — a climbing count points at a bad cable or connector, not the radio's RF performance.
category: ethernet-poe-cabling
icon: alert-triangle
aliases:
  - FCS error
  - frame check sequence error
  - checksum error
relatedFields:
  - lanPort.crcErrorCount
---

## Technical

A CRC (Cyclic Redundancy Check) error means an Ethernet frame arrived with data that doesn't match its own checksum — the frame was corrupted in transit and gets discarded. A healthy link should show zero or near-zero CRC/FCS errors; a climbing count, especially alongside a fallen-back negotiated link speed, is a strong signature of a physically degraded cable or connector (corrosion, water ingress, a bad crimp) rather than anything wrong with the radio's RF performance.

This is precisely the kind of fault that leaves RF readings — signal, SNR, chain balance — completely clean while the Ethernet layer quietly fails underneath.

## Layman

This is a running count of how many chunks of data arrived garbled and had to be thrown away. Zero is normal; a number that keeps climbing points at a physical problem with the cable or connector — not the radio itself, and definitely not the wireless signal.
