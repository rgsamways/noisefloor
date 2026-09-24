---
id: poe
slug: poe
title: PoE (Power over Ethernet)
summary: How an outdoor radio gets both power and data through a single cable — which also means a bad cable can cause power problems, not just connectivity ones.
category: ethernet-poe-cabling
icon: zap
aliases:
  - Power over Ethernet
  - PoE injector
relatedFields:
  - lanPort.linkUp
---

## Technical

Power over Ethernet (PoE) delivers electrical power to an outdoor radio over the same Ethernet cable that carries its data, eliminating the need for a separate power line to a rooftop or pole-mounted device. A PoE injector sits indoors between the customer's router/switch and the outdoor radio, injecting DC power onto unused or shared conductor pairs.

Because power and data share the same cable, a degrading cable or connector doesn't just corrupt data — high resistance from corrosion or a failing pair causes voltage drop, which can brown out and reboot the radio, producing short, repeating uptimes with no actual house power outage.

## Layman

This is how an outdoor radio gets both its electricity and its internet connection through a single cable, instead of needing a separate power cord run all the way up to it. It's convenient, but it also means a damaged cable can cause power problems, not just internet problems — a radio that keeps rebooting on its own is often a cable issue in disguise.
