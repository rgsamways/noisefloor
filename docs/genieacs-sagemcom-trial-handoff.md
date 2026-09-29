# Handoff: GenieACS bench trial for Sagemcom 5260 remote management — CONCLUDED, blocked

> Note: this file originally held the *pre-trial plan* (written before the trial ran). It's been updated in place with the actual outcome — the plan below did not pan out. Full blow-by-blow detail (screenshots' worth of findings, hex dump analysis, search sources) lives in `docs/HANDOFF.md` in the separate `genieacs` repo (`C:\dev\genieacs\docs\HANDOFF.md`) if deeper context is ever needed.

## Background: two different devices at a customer site

Worth being explicit about this distinction for any future work, since it's easy to conflate:

1. **The in-home router** — a Sagemcom F@st 5260, handling the customer's Wi-Fi/LAN. This is what this trial targeted, and it's a dead end (see below).
2. **The radio/CPE** — separate fixed-wireless hardware connecting the customer's site to NRN's towers/network. Different device, different vendor, and (per Robin) something NRN owns and controls outright, unlike the router. **This is the more promising angle for noisefloor going forward** — see "Where this leaves noisefloor" below.

## What was tried

- Stood up GenieACS successfully (self-hosted, Docker Compose, `genieacs` 1.2.16.0 + `mongo` 8.0) — proved the ACS software itself isn't the problem, it worked cleanly end to end (wizard, admin login, all four ports reachable).
- Opened Windows Firewall for port 7547 (with confirmation first).
- Got a bench Sagemcom F@st 5260 on the same network as the laptop and went looking for its TR-069/CWMP configuration.

## What was found (router side — dead end)

- NRN's actual Sagemcom F@st 5260 router stock — confirmed by Robin as literally what's sent to customers, not a one-off bench oddity — **has TR-069 disabled at the firmware level**. No config option anywhere in the admin GUI (checked every tab: Router Settings, Access Control, Internet Connectivity). Zero CWMP activity in the device's own debug-level logs from boot.
- These units are Spectrum-branded carrier-surplus stock, bulk-acquired at **~$5/unit** — the lockdown is intentional (carriers strip remote-management access from decommissioned hardware precisely to prevent third-party reuse like this).
- Two possible workarounds were investigated and ruled out:
  - **Firmware/hardware hacking** (JTAG/serial root access): not viable at NRN's scale (hundreds of these units in the warehouse) — would require per-device manual hardware work.
  - **Config backup/restore file editing**: a known trick on *older* Sagemcom models (F@st 3864/3486/5355) with public decryption tools. Pulled and hex-dumped this router's actual backup file — it uses a modern, properly-structured AEAD encryption scheme, not the older crackable format. No shortcut without extracting and reverse-engineering the firmware image for the key; no public precedent found for this exact firmware build.
- Considered switching to TP-Link's Aginet HX510/HX520 hardware, which works with TAUC (TP-Link's own cloud ACS/portal) out of the box. Ruled out on cost: ~$70-100/unit vs. ~$5/unit for the Sagemcom stock. **NRN has decided not to buy this hardware.**

**Bottom line: there is currently no way to remotely manage NRN's in-home router fleet.** This isn't an engineering problem to keep chipping at — it's a hardware/procurement dead end unless NRN's sourcing changes.

## Vendor landscape, for whenever procurement revisits this

TR-069 lockdown is a **carrier-branding decision**, not an inherent hardware limitation — the same silicon/firmware family often ships wide open when sold as generic "ISP CPE" rather than white-labeled for one specific carrier. Vendors confirmed (via web search, not verified against NRN bulk pricing) to sell genuinely open/configurable TR-069 CPE:

- **MikroTik** — has a real, user-configurable TR-069 client (`tr069-client` RouterOS package, settable ACS URL). Already a common brand in WISP circles; worth a fresh pricing look since it wasn't part of the TP-Link-only comparison.
- **Zyxel** — markets TR-069/TR-369 explicitly, interoperates with third-party ACS vendors.
- **Mercusys** — TP-Link's budget sub-brand, also explicitly supports building your own ACS. Different price tier than the Aginet HX-series already ruled out.

None of this is pricing-verified for NRN's bulk-order reality — needs real quotes before assuming any of these are actually affordable.

## Where this leaves noisefloor

Noisefloor's own long-standing idea — generating real support tickets from live diagnostic data — has been blocked on "a way to connect to real customer radios/CPE." The router investigation above is a dead end for the *in-home router*, but it doesn't touch the *radio* side, which is the device noisefloor actually cares about and which NRN controls outright (no carrier lock-in like the router has).

**Open question, unconfirmed — check with Robin before designing anything:** Robin's browser has a bookmark for "UISP | northernrural..." — UISP is Ubiquiti's ISP management platform. If NRN's fixed-wireless radios are Ubiquiti gear managed through UISP, that platform likely already has an API exposing link stats, signal strength, uptime, connected devices, etc. This should be confirmed directly: (a) are NRN's radios in fact Ubiquiti/UISP-managed, (b) has anyone at NRN pulled data from UISP's API before, (c) what does that API's actual surface/auth model look like. If UISP is already in place, it may substantially shortcut or even eliminate noisefloor's "no way to connect to real radios" blocker.

**Architecture principle to carry forward:** keep any backend/data-source service (GenieACS, or potentially UISP) as its own thing — infrastructure, not application code imported into noisefloor. What belongs inside noisefloor is a UI/feature layer that calls out to that service's API.

## How Robin likes to work on this kind of thing

- Prefers one straight-line path through next steps, not branching menus of options.
- Wants facts about his environment/setup confirmed with him directly rather than assumed or guessed, especially for hardware, network topology, and vendor/procurement details.
- Comfortable with technical dead-ends stated plainly rather than softened — appreciates a direct "this is blocked" over false optimism, while still wanting concrete alternate angles raised when there's a genuine one (e.g. the UISP question above).
- System-level or hard-to-reverse changes (firewall rules, etc.) got explicit confirmation first before acting.
