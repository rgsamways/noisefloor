# Noise Floor — Console Handoff

**Date:** September 21, 2026
**Status:** Direction change. Supersedes the case-study approach in NOISEFLOOR-OUTLINE.md for phase one.
**Drop into:** `/docs/` in the Noise Floor repo.

---

## 1. What changed and why

The case-study build in VS Code didn't work. The cases rolled out disjointed, and the synthetic dashboard graphs didn't convey what a tech actually sees when staring at a Ubiquiti admin screen during a call. The problem wasn't the questions — it was that static recreations can't capture a live link: numbers moving, noise on the readings, the feel of a healthy link versus a sick one.

**New direction:** build one vendor-neutral fixed-wireless radio console. One screen, one mental model. Under the hood it can eventually pull from any vendor's API; the tech never needs to know which. The skill being taught is *reading a link*, not reading AirOS or WinBox or cnMaestro.

Case studies, quizzing, scoring, and the authoring/progression tiers are parked — not deleted. They can return in a later phase built on top of the console.

## 2. The product in one paragraph

A single front end that displays the core set of readings every fixed-wireless radio produces, normalised into one schema regardless of vendor. Phase one drives it with a simulation engine so trainees can learn what *normal* looks like, then watch links degrade in realistic ways. Phase two swaps in real vendor drivers feeding the same schema. The console is the product; training is what phase one happens to be good for.

## 3. Phases

### Phase one — simulation only
- Live panel. Readings drift and move believably, like a real radio screen. Not static snapshots.
- **Healthy baseline mode.** A link running idle, so the trainee builds a gut sense of normal.
- **Degradation scenario library.** Faults dropped on top of the baseline that push readings off normal.
- **Not a quiz.** No scoring, no submitted answers. It's a reading instrument. The trainee looks at it and says to themselves "signal is good but capacity is low."
- Two panels, not one: the **radio link** on top, the **service layer** underneath (see §5). Scenarios can break either.

### Phase two — real data
- Vendor drivers behind the same schema. The UI doesn't change.
- A small vendor badge somewhere on screen — diagnosis is vendor-neutral, remedy isn't, and a tech needs to know which manual to reach for.

## 4. The core schema — 21 radio fields

Define units and sane ranges for every field now. If the schema is right, phase two is additive rather than a rewrite.

### Radio link
| Field | Unit | Notes |
|---|---|---|
| Signal strength | dBm | |
| Noise floor | dBm | |
| SNR | dB | Signal minus noise. Some vendors don't report it directly (Cambium ePMP/PMP450) — derive it. |
| Link quality | % | Ubiquiti CCQ; Cambium link efficiency; approximate mapping, flag honestly |
| Modulation / MCS | index | |
| Frequency | MHz | |
| Channel width | MHz | |
| Link state | enum | connected / associating / down |
| Chain imbalance | dB | Per-antenna difference. Catches a bad cable or wet connector immediately. |
| TX power | dBm | A radio pinned at max is a warning sign on its own |

### Throughput and capacity
| Field | Unit | Notes |
|---|---|---|
| TX rate | Mbps | |
| RX rate | Mbps | |
| Airtime | % | The one that explains capacity. Great signal + saturated airtime = slow. |
| Channel utilisation | % | Whole spectrum, not just this link |
| Client count | n | Sector capacity is shared |

### Far end
| Field | Unit | Notes |
|---|---|---|
| Distance | km | |
| Latency | ms | |
| Jitter | ms | |
| Packet loss | % | Distinct from retries — retries recover, loss doesn't |
| Errors / retries | count | |

### Radio health
| Field | Unit | Notes |
|---|---|---|
| CPU / memory | % | A struggling CPU looks like a bad link |
| Temperature | °C | Matters more than expected on a hot tower |
| Uptime | duration | See §4a — bare uptime is nearly useless |

Anything vendor-specific that doesn't map (airMAX quality, Tarana per-subscriber capacity, etc.) goes in a **vendor-extras** bucket, never forced into a core field.

### 4a. Time evidence — its own group

Tier 1 is told to check when a radio last rebooted and when it last logged. Vendor screens bury this (AirOS shows uptime in a corner). Make it first-class:

- **Last reboot** — "rebooted 40 minutes ago" is a diagnosis when the customer says it started an hour ago.
- **Last log entry** — where the log *stops* is often the moment the device lost the ability to talk.
- **Last successful poll** — see staleness below.

### 4b. Staleness must be visible

When a radio stops responding, last-known values sit in memory. A naive panel keeps showing them and the screen looks healthy while the link is dead. Techs get caught by this constantly.

- Every field carries an age.
- Fresh readings show plainly; stale ones grey out or show the timestamp; a dead poll says so outright.
- In simulation, this is directly teachable: drop the far end mid-scenario and let them notice the numbers stopped moving.

## 5. The service layer — second panel

The 21 fields tell you about the radio link. They are silent on everything past it. **A green radio panel is not the same as a working customer.** This is the single most valuable lesson in the whole thing, and the console must teach it.

### Fields
- **DHCP lease:** present / absent, issued at, time remaining, lease address vs what records say it should be.
- **Addressing:** radio management IP, gateway, customer WAN address.
- **NAT:** is the ISP handing a private address (upstream NAT)? Is the customer router doing its own? Double NAT breaks inbound (cameras, gaming, VPN) while browsing works.

### Service-layer faults (declared directly in simulation)
- Expired lease — router asked repeatedly, nothing answered, gave up, self-assigned a useless address, and won't try hard again.
- Wrong boot order after a power cut — router came up before the radio, missed DHCP, sits there broken. Radio green, customer down. The fix is the "stupid" one: unplug both, radio first, wait, then router.
- Double NAT.
- Rogue DHCP server — customer router plugged into a LAN port instead of WAN, now handing out addresses to the whole segment. "Works sometimes."
- Customer router offline.

### Tier 1 procedure this maps to
1. Confirm the radio link is actually up. If it's down, a router reboot just yields a second expired lease.
2. Power-cycle in order: radio first, wait a minute, then router.
3. Watch for a **new lease appearing**. That's the proof, not the customer saying it seems okay.
4. If the link is healthy and it still won't take a lease — not Tier 1.

## 6. Simulation engine — what "believable" means

Four things separate a real-feeling panel from 21 random walks:

1. **Correlated movement.** Signal drops → SNR follows → rates step down through MCS levels → retries climb. If fields move independently, anyone who knows radios spots it as fake instantly. This is a small physics model with a few knobs, not random noise.
2. **Time signatures.** Each fault has a shape and duration, not just an end state.
   - Rain fade: ramps over minutes, recovers.
   - Wind misalignment: sudden step change that stays.
   - Interference: intermittent, often a daily rhythm.
   - Failing cable / water ingress: slow degradation over weeks.
   - Foliage growth: seasonal, gradual.
3. **Normal is relative to the link.** A 200 m urban shot and a 15 km rural shot have different healthy numbers. Set a **link profile** first (distance, band, gear class); "normal" is judged against it.
4. **Sudden vs gradual.** Rule of thumb worth encoding: sudden breakage is usually something plugged in wrong; gradual breakage is usually weather or the path.

## 7. Logs — what the console should reflect

- Embedded radios have tiny ring-buffer logs. Busy devices overwrite hours of history; quiet devices keep months. A log that jumps from May to September means nothing happened in between — **a sparse log is a stable device.**
- **Repetition is the signal.** One association drop is life. The same line forty times an hour is the fault. DHCP retries with nothing answering are the most common one seen in practice.
- Timing of retries matters: clustered right after a link event → boot order; constant with the link solid → configuration (VLAN, bridging), above Tier 1.
- Useful log events to simulate: reboot (and stated reason), link drop/reassociate, auth failure, DHCP request/response.

## 8. Vendor landscape for phase two

Researched Sept 21, 2026. Three transport styles to cover.

| Vendor | Platform | Access | Notes |
|---|---|---|---|
| Ubiquiti | AirOS / UISP | Unofficial JSON scrape | No official AirOS API; `status.cgi` returns JSON after cookie login. Maintained community libraries exist (e.g. python-airos). UISP has a proper API. |
| MikroTik | RouterOS 7 | REST (JSON wrapper over console API) | `https://<ip>/rest`. Registration table gives MAC, signal, rates, uptime, SNR. Path differs ROS6 (`/interface/wireless/...`) vs ROS7 (`/interface/wifi/...`). SNMP also available. |
| Cambium | cnMaestro | REST, OAuth 2.0 client credentials | Most formally documented. Supports ePMP, PMP, Wi-Fi monitoring. SNR reported for cnPilot but historically not ePMP/PMP450 — derive. |
| Tarana | TCS | REST ("Northbound API") | Device inventory, topology, provisioning, billing. Docs behind operator/partner login — need credentials for schemas. |
| Siklu | EtherHaul | SNMP / CLI | Not REST. RSSI, CINR, TX power, error counters via their MIB. LibreNMS already has the OIDs mapped. |
| TP-Link | Tako / Talk Cloud | Vendor cloud | Router side, not radio. Shows online state, WAN IP, some settings. Same pattern as UISP — an adapter candidate for the service layer. |

Customer-premises kit at NRN: Sagemcom and TP-Link (most often HX220). Only router visibility today is TP-Link's cloud.

## 9. Architecture (three layers)

1. **Drivers** — one per vendor. Authenticate, fetch, return raw. Nothing else.
2. **Normaliser** — maps raw into the schema in §4/§5 plus vendor-extras. This is where the hard decisions live (is Cambium link efficiency close enough to CCQ to share a field?). Be honest when they don't map.
3. **Console UI** — only ever talks to the normalised shape. Phase one's simulation engine is just another source plugging into it.

## 10. What phase one proves

- A trainee can build a gut sense of healthy vs sick without a single real radio.
- They see faults in an afternoon that would take months to encounter on the job.
- The schema works. If 21 fields plus a service layer render a believable link in simulation, they'll render a real one in phase two.

## 11. Design direction (unchanged)

Plain black-and-white, navigation on the bottom ("because this is noisefloor"), responsive laptop vs mobile, Lucide icons. Existing homepage mockup stands.

## 12. Out of scope for phase one

- Case studies, quizzing, scoring
- Authoring tools, T1/T2/T3 progression, org workspaces
- Any real device connection
- Remedy guidance (vendor-specific fixes) — diagnosis only
