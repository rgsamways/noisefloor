---
id: rain-fade
slug: rain-fade
title: Rain fade
summary: Signal loss caused directly by precipitation — usually small on customer bands, severe on high-frequency backhaul, and often confused with rain-adjacent causes.
category: environmental-effects
icon: cloud-rain
aliases:
  - precipitation fade
relatedFields:
  - link.signalDbm
---

## Technical

Rain fade is signal attenuation caused directly by precipitation in the radio path. Its significance depends heavily on frequency: at common customer bands (900 MHz, 2.4/5 GHz), true rain fade is small — often a dB or less even in heavy rain — and rarely takes down a healthy link on its own. At higher licensed frequencies used for backhaul (11-80 GHz), rain fade is severe, often many dB per kilometer, and can drop a link outright.

On a 5 GHz customer link, a large drop during rain more often points at something rain-related rather than rain fade itself — wet foliage, water pooling on a radome, or a link with so little margin that any small loss pushes it over the edge. The diagnostic signature, when it is rain fade, is symmetric in both directions and recovers within roughly the duration of the rain event.

## Layman

Heavy rain really can affect radio signals, but for most home internet connections the effect is much smaller than people expect — a few dB at most. If a customer's connection tanks hard every time it rains, the rain itself is rarely the whole story; something rain-adjacent, like water finding its way into a connector or thin signal margin to begin with, is usually the bigger culprit.
