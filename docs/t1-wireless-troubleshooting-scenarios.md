# T1 Fixed Wireless Troubleshooting Scenarios

How a Tier 1 support technician identifies common faults on a fixed wireless link, covering both the customer radio (CPE) side and the tower (AP/sector) side, how to tell each fault apart from look-alikes, and what a good escalation note looks like.

A note that applies throughout: the most useful single tool a T1 tech has is **history**. A current reading tells you something is wrong; a graph over days or weeks usually tells you *what* is wrong, because each fault has its own shape.

---

## 1. Misalignment: has the radio/dish moved off the tower?

### What misalignment looks like

Misalignment is a physical geometry problem: the dish is no longer pointing its strongest beam at the tower. The signature is a **sudden, permanent step down** in signal at a specific moment, which then stays at the new lower level. It doesn't recover on its own, doesn't vary much with time of day, and usually lines up with a physical event: a windstorm, ice loading, a bracket slipping, or someone working on the roof, eavestroughs, siding, or an old satellite dish near the mount.

### Customer radio (CPE) side

- **Signal strength (RSSI, dBm) versus baseline.** Every CPE has a known-good reading from install, e.g. -58 dBm. If it's now -72 dBm, the link has lost 14 dB, roughly a 25-fold drop in received power. Compare against history in UISP, cnMaestro, or the ISP's monitoring rather than judging today's number in isolation.
- **SNR.** Signal minus noise floor. With misalignment, signal falls but the noise floor stays the same, so SNR drops by about the same amount as the signal.
- **Chain balance.** Most radios have two chains (commonly horizontal and vertical polarization) and report a level for each. On a well-aimed link they sit within a few dB. A dish that has **swung sideways or tilted** tends to drop both chains together. A dish that has **rotated on its mount** throws polarization off and tends to split the chains apart (e.g. -60 on one, -71 on the other).
- **Modulation, capacity, quality.** As signal drops, the radio steps down to slower, more robust modulation (e.g. 256QAM to 16QAM). Capacity falls, retransmissions rise, CCQ/link quality drops. Customers experience "slow," not usually "down," unless the drop is severe.

### Tower (AP/sector) side

- **The AP's view of this CPE.** Misalignment degrades **both directions roughly equally**. If the CPE hears the AP 14 dB worse, the AP should hear the CPE about 14 dB worse too.
- **Other subscribers on the same sector.** If only this CPE dropped, the customer's dish moved. If many CPEs on the sector dropped at the same moment, the **sector antenna on the tower** may have moved: an urgent, multi-customer escalation.

### Telling it apart from look-alikes

- **Interference:** noise floor rises instead of signal dropping; often one-sided.
- **Foliage:** gradual decline over weeks, seasonal, signal wobbles in wind.
- **Snow or ice on the dish:** drop that recovers once it melts.
- **Cable fault:** RF looks fine; Ethernet side shows errors or slow link speed.

### Ask the customer

- Did it start after a windstorm, ice storm, or heavy snow?
- Has anyone been working on the roof or near the mount?
- Can they see the dish from the ground? Tilted, pointed differently, mast leaning, bracket loose? (Look only, no climbing or adjusting.)

### Escalation note example

> CPE signal dropped from -58 to -73 dBm in a single step on Sept 12 around 3 AM, coinciding with a wind event. Both directions degraded equally, noise floor unchanged, chains now 9 dB apart. Other CPEs on the sector unaffected. Customer reports the dish looks tilted from the ground. Suspect CPE misalignment/rotation. Needs realignment visit.

---

## 2. Rain: is rain causing signal to vary intermittently (rain fade)?

### How much rain matters depends on frequency

- **900 MHz, 2.4 GHz, 5 GHz** (typical customer links): true rain fade is **small**, usually a dB or less over normal customer distances even in heavy rain. Rain alone rarely takes down a healthy 5 GHz link.
- **Higher frequencies** (licensed 11, 18, 24 GHz backhaul; 60/70/80 GHz links): rain fade is **significant**, often many dB per km in heavy rain, and can drop the link. These are typically tower-to-tower backhauls.

On a 5 GHz customer link, a big drop during rain usually means something rain-*related*: wet foliage in the path, water on the radome, water in a connector, or a link with so little margin that a small loss pushes it over the edge.

### Customer radio (CPE) side

- **Correlate signal history with weather** (radar, Environment Canada historical data). Rain fade shows as dips that **start with the rain, track its intensity, and recover when it stops**.
- **Check fade margin.** How far the signal can drop before the link fails or falls to unusable modulation. A link at -78 dBm with thin margin will visibly suffer in rain; one at -55 dBm won't notice. If a link keeps suffering in weather, the real fix may be improving the baseline signal.
- **Watch modulation.** Rain-affected links step down during rain and back up afterward. A link that stays degraded long after rain is not showing rain fade.

### Tower (AP/sector) side

- **Both directions degrade together**; rain attenuates the path itself.
- **Neighbouring customers move in sequence** as the rain cell crosses them. A single customer dipping alone suggests something local.
- **Whole tower drops in heavy rain → check the backhaul.** High-frequency backhaul is far more rain-sensitive than customer links.

### Telling it apart from look-alikes

- **Wet foliage:** bigger drop than rain alone would cause, **lingers after rain stops** until leaves dry. Worse in summer.
- **Snow/ice on dish:** persists until melt, hours or days.
- **Water in a cable connector:** shows as **Ethernet** problems (CRC errors, link flaps, 100 Mbps fallback, radio reboots), not RF loss. Often starts hours after rain and persists for days.

### Escalation note example

> Signal dips from -64 to -69 dBm during rain events over the past 3 weeks, recovering within ~1 hour of rain ending. Symmetric in both directions, noise floor steady. Neighbouring CPEs show similar dips in sequence. Link margin is thin, so modulation drops during storms. Consistent with rain fade plus low margin; recommend reviewing alignment/antenna upgrade to improve baseline.

---

## 3. Foliage: are trees interfering, currently and seasonally?

### Why trees matter even with visible line of sight

A radio link needs a clear football-shaped zone around the direct line, the **Fresnel zone**. Rule of thumb: keep at least 60% of the first Fresnel zone clear. Trees can intrude without blocking the direct line and still cause loss and instability. At 5 GHz, leaves (especially wet ones) absorb and scatter signal well.

### Current foliage problems (CPE side)

- **Signal below baseline with a noisy, wobbling graph.** Trees move in wind, so signal fluctuates by several dB rather than holding steady. This wobble is the strongest clue for trees and distinguishes foliage from misalignment (steady step down).
- **Worse when windy, worse when wet.**
- **Chain imbalance and multipath.** Chains may disagree and vary independently; retransmissions rise; modulation hunts up and down.

### Seasonal foliage problems

Look at a year or more of history:

- **Deciduous trees** (maple, birch, poplar, oak): decline through **May–June** as leaves come out, worse through summer, recovery **October–November** after leaf drop. Repeats yearly.
- **Coniferous trees** (pine, spruce, cedar, hemlock): little seasonal change; effect shows as **gradual year-over-year worsening** as they grow into the path.
- **Year-over-year comparison.** If this June is worse than last June, trees are growing into the path and it will keep getting worse.

### Tower (AP/sector) side

- **Both directions affected about equally.**
- **Usually just this customer.** If several customers in the same direction share the pattern, look for obstruction closer to the tower or a shared tree line/ridge.

### Tools and questions

- **Link planning tools** (UISP Design Center, Cambium LINKPlanner, Google Earth) show terrain and path, though individual trees are often not modelled accurately.
- **Ask:** Trees between house and tower? Grown noticeably? Neighbour planted a hedge or stopped trimming? Anything built in the path? Worse in summer?

### Escalation note example

> Signal drops from ~-60 dBm in winter to ~-71 dBm from late May, with ±4 dB fluctuation correlated to wind. Worse after rain. Same pattern last year but about 3 dB milder, suggesting growth. Customer confirms mature trees and a row of spruce between house and tower. Suspect foliage in Fresnel zone; recommend site visit to assess raising the mount, relocating, or trimming.

---

## 4. Interference: what's the current level on both ends?

### Why interference is one-sided

Interference is unwanted energy on or near the link's channel: other WISPs, other radios on the same tower, neighbouring Wi-Fi, other equipment. **It is local to each receiver.** The CPE hears what's around the customer's house; the AP hears what's around the tower and across its whole sector. So interference often affects **one direction much more than the other**, unlike misalignment, rain, and foliage.

### Key measurements

- **Noise floor.** On a clean 20 MHz channel at 5 GHz, commonly around -90 to -95 dBm. -80 or higher means something is filling the channel.
- **SNR.** Signal can be normal while SNR falls because noise rose. Compare with baseline and see which side changed.
- **Retransmissions, packet loss, modulation hunting.** **Good signal but poor performance** is a strong interference signature.
- **EVM / link quality metrics** where reported.

### Customer radio (CPE) side

- Check CPE **noise floor and SNR** against history.
- Look for **local sources**: other WISP radios on neighbouring homes, neighbour equipment on the band, anything newly installed.
- CPE side bad, AP side fine → problem local to the customer.

### Tower (AP/sector) side

- Check the **AP's noise floor**. If it has risen, **every customer's uplink on the sector** suffers: widespread slow uploads and retransmissions.
- **Co-location and GPS sync.** Multiple APs on a tower should be GPS-synchronized. An unsynchronized AP, or one that lost sync, interferes with its neighbours.
- **DFS events.** On DFS channels, suspected radar forces a channel change. The log shows the event; customers see a brief outage and possibly a worse channel afterward.

### Tools

- **Spectrum analysis:** Ubiquiti airView, MikroTik spectral scan / frequency-usage, Cambium built-in spectrum analyzer. **Caution:** on some models this takes the radio off air while scanning. Check policy before running on a live link, especially an AP (drops the whole sector).
- **Site survey / scan:** other networks on same or adjacent channels and their levels.
- **Time-of-day patterns.** Interference often follows usage, worse in the evening. Appears nightly and disappears overnight → interference, not a physical fault.

### Telling it apart from look-alikes

- **Misalignment, rain, foliage:** *signal* falls, symmetrically.
- **Interference:** *noise* rises, often one-sided, signal unchanged.

### Where T1 stops

Channel, width, and frequency plan changes are network operations work, since one AP change affects every customer on it. T1 gathers data and escalates.

### Escalation note example

> Customer reports slow evening speeds. CPE signal steady at -61 dBm, but CPE noise floor rises from -92 to -79 dBm between ~6 and 11 PM daily. AP-side noise floor unchanged and AP hears the CPE fine, so upload normal, download degrades. Site survey shows a new network on an adjacent channel at -70 dBm. Suspect local interference at customer end. Recommend channel review.

---

## 5. Cable: is a cable degraded, externally or internally?

### Where the cables are

The Ethernet run from the **outdoor radio** to the **PoE injector** indoors, plus the patch cable from the injector to the **customer's router**. At the **tower**, cabling from each AP to the tower switch/router. The RF link can be perfectly healthy while any of these fails.

### Customer radio (CPE) side: remote evidence

- **Negotiated link speed.** Gigabit needs all four pairs; 100 Mbps uses only two (pins 1-2 and 3-6). A radio that should link at 1000/full showing 100/full means one of the other pairs is broken, corroded, or badly crimped. Customers see speed "stuck around 90-something Mbps." 10 Mbps or half duplex is worse.
- **Interface error counters.** CRC/FCS, alignment, rx errors on the LAN port = corrupted frames. Healthy is zero or near-zero. Watch whether counters climb live.
- **Link flaps and reboots.** Radio is powered over the same cable; high resistance from corrosion or a failing pair causes voltage drop and brownout reboots. Short, repeating uptimes with no house power outage point hard at cable or injector.
- **Built-in cable tests.** MikroTik `/interface ethernet cable-test` reports per-pair status (ok/open/short) and approximate distance to fault. Some Ubiquiti and Cambium gear has similar. 2 m = indoor end; 25 m = up on the roof.
- **Separate RF from wire.** Clean signal/SNR/modulation but Ethernet errors or slow link speed → problem is below the radio.

### What the customer can check indoors

- **Injector lights:** PoE and LAN on and steady?
- **Reseat both ends** at the injector.
- **Swap the patch cable** between injector and router.
- **Inspect reachable runs:** pinched under door/window, crushed behind furniture, kinks, staples through the jacket, pet damage.
- **Check ports:** POE to radio, LAN to router.
- **Bypass the router:** laptop directly into the injector's LAN port.

### External causes (usually confirmed on a truck roll)

- **Water ingress:** moisture wicking into the RJ45, corroded pins (green/white crust). Missing drip loop or unsealed boot. Often starts hours after rain, persists for days.
- **UV damage:** indoor-rated cable outdoors, cracking and letting water in.
- **Rodents/squirrels** chewing the run.
- **Physical stress:** flattened in a window frame, rubbing on a mast edge, no strain relief.
- **Lightning/surge:** damaged pairs or port without killing the radio; errors or 100 Mbps fallback right after a storm.
- **Bad cable:** copper-clad aluminum (CCA) degrades and handles PoE poorly. Runs over 100 m are out of spec.

### Tower (AP/sector) side

- A degraded tower cable shows the same symptoms on the AP's port and the switch port: errors, slow speed, flaps, AP reboots.
- Effect is **sector-wide**: every customer on the AP sees slowdowns/drops at the same moments while RF looks normal.
- Urgent escalation; needs a tower climb, never T1 territory.

### Symptom patterns

- **Weather:** rain/thaw/humidity → water in a connector; wind → cable flexing at a damaged spot; cold snaps → marginal connection contracting.
- **Timing:** after renovations, roofing, moving furniture, or a storm → most recent physical disturbance.
- **Fix pattern:** reboot/reseat helps temporarily then it returns → marginal physical connection, not configuration.

### Escalation note example

> Radio negotiating 100/full (should be 1000), CRC errors climbing, radio uptime resetting several times a day with no power outage. Cable test shows pair 3 open at ~22 m. RF signal normal. Drops correlate with rain. Patch cable swapped, no change. Suspect outdoor connector water ingress; needs re-termination or new run.

---

## 6. Client router: expired lease, or stopped communicating with the radio?

### First: bridge mode or router mode?

- **Bridge mode:** radio passes traffic through. Customer router gets its address directly from the ISP (DHCP or PPPoE). Radio sees the router's MAC but doesn't hand out its address.
- **Router mode:** radio runs DHCP and NAT, handing a private address to the customer router. Radio's DHCP lease table shows the router directly.

### Data points a radio can register

**Interface (LAN/Ethernet port)**
- Link status, negotiated speed and duplex.
- Time of last link-up/link-down.
- Rx/tx byte and packet counters. Link up but **rx counters not incrementing** = router isn't sending: hung, frozen, or booting.
- Error counters (CRC, drops) → cable rather than router.

**Bridge/MAC table (host table, FDB)**
- MACs learned on the LAN port and how recently.
- Router MAC present and fresh = transmitting something. Absent or aged out = gone silent.
- **New/different MAC** = customer may have replaced the router; matters if leases or auth are bound to a MAC.

**ARP table**
- Router IP ↔ MAC mapping.
- State: reachable, stale, incomplete/failed. Incomplete with link up = router not answering at Layer 3.

**DHCP (router mode, server on the radio)**
- Lease table: IP, MAC, hostname, expiry, status (bound, offered, expired, waiting).
- **Expired and never renewed** = router stopped asking. **Offered repeatedly without success** = router asking but not completing the exchange.

**DHCP (bridge mode, ISP-side server)**
- Lease for the router's MAC: IP, lease time, last renewal.
- Option 82 / relay info may tie the lease to the CPE or AP.
- Expired lease while radio link is up → points at the router.

**PPPoE (if used)**
- Session status on the concentrator: up/down, uptime, last disconnect reason.
- RADIUS accounting: start/stop times, disconnect cause.
- Failed auth attempts can mean a factory-reset router that lost its credentials.

**Routes**
- Router mode: radio's default route upstream and connected route for the customer-side subnet.
- Routed/static setups: routes to the customer subnet via the router. If the router's address changed, a static route can point at nothing.

**Active tools on the radio**
- **Ping** the router.
- **ARP ping** (MikroTik), works when a router ignores ICMP.
- **Traffic monitor / torch**: live flows on the LAN port.
- **MAC scan / neighbour discovery** (MNDP, LLDP, CDP, Ubiquiti discovery).
- **Connection tracking / NAT table** in router mode: active sessions = router alive and passing traffic.

**Logs**
- DHCP events (assigned, deassigned, offered, expired).
- LAN link up/down events.
- PPPoE/authentication events.

### How to read it

- **Link down:** router off, unplugged, cable issue, or dead port.
- **Link up, rx flat, MAC aging, ARP incomplete:** router hung. Power cycle.
- **Link up, MAC present, lease expired not renewed:** router stopped renewing (bug or hung WAN process). Reboot or release/renew.
- **Offers repeating without success:** check MAC change, lease binding, router config.
- **Router shows 169.254.x.x:** never got a lease, self-assigned.
- **New MAC on port:** router swapped; MAC-bound service won't work.

### Tower (AP/sector) side

- AP shows CPE **associated normally** with good signal; problem is behind the radio.
- Upstream (DHCP, PPPoE, RADIUS) shows lease expired or session dropped; timing is useful.
- Many customers' leases failing at once → ISP DHCP server, relay, or core, not the routers.

### Escalation note example

> CPE associated, signal normal. Radio LAN link up 1000/full, no errors. Router MAC in bridge table but aged, ARP incomplete, rx counters flat. ISP DHCP lease for router MAC expired 02:14 and never renewed. Router appears hung; walked customer through power cycle, lease renewed, service restored.

---

## 7. NAT: are one or more devices (radio, routers) NATing, or NATing everything?

### The problem

One layer of NAT at the customer router is normal. Problems start when **more than one device does it** (double or triple NAT), or the wrong device does it. Common causes:

- **Radio in router mode** with NAT plus the **customer router** also NATing.
- **Mesh Wi-Fi in router mode** behind the customer router.
- **Switch instead of a router** plugged into a router-mode radio, so the radio NATs every device directly.
- **ISP carrier-grade NAT (CGNAT)** adding a layer upstream.

### Symptoms customers report

- Port forwarding doesn't work.
- Game consoles report **strict or moderate NAT type**.
- VoIP one-way audio or dropped calls.
- VPN failing or unstable.
- UPnP not working.
- Remote access to cameras/home servers failing.

General browsing usually works, so customers often don't notice until one app fails.

### Customer radio (CPE) side

- **Radio mode:** bridge or router? In router mode, is NAT/masquerade enabled?
- **Radio DHCP lease table:** if the radio hands an address to the customer router, the router's own NAT is a second layer.
- **What's behind the radio:** one MAC (the router) is normal. Many MACs (phones, laptops, TVs) = devices connecting straight to the radio, usually via a switch, and the radio NATs all of them. The customer's router may be missing or plugged in wrong.
- **NAT / connection tracking table** in router mode: which internal addresses are being translated.

### What the customer can check

- **Router WAN IP.** A **private address** (10.x.x.x, 172.16–31.x.x, 192.168.x.x) when design says public → something upstream is NATing. **100.64.0.0/10** (100.64.x.x–100.127.x.x) usually = ISP CGNAT.
- **Address conflict.** Router WAN and LAN in the same subnet (both 192.168.1.x) → routing breaks. Common when radio and router both default to 192.168.1.x.
- **Traceroute:** count private-address hops before the first public one.
- **Mesh systems:** router mode vs access point/bridge mode. Router mode behind another router = double NAT.

### Tower (AP/sector) side

- **Bridge mode:** upstream sees the **customer router's MAC** through the CPE; ISP DHCP lease belongs to that MAC.
- **Router mode:** upstream sees only the **radio's MAC**; lease belongs to the radio.
- Lease owner doesn't match design → radio mode doesn't match the plan.
- Public IP service showing a private or CGNAT address → check provisioning.

### Fix direction

Only one device should NAT. Usually: radio to bridge mode (per ISP design), or customer's extra router/mesh to access point/bridge mode. Radio config changes may be restricted at T1; walking a customer through setting their mesh to AP mode usually isn't.

### Escalation note example

> Customer's Xbox reports strict NAT, port forwards fail. Radio in router mode with NAT, handing 192.168.1.x to customer router, which also NATs to 192.168.0.x. Double NAT confirmed. Customer's mesh is in router mode behind that as well (triple NAT). Walked customer through setting mesh to AP mode; recommend radio change to bridge mode per standard config.

---

## 8. Router offline: is the customer's router currently offline?

### The layered approach

Where does reachability stop? Work outward from the tower:

1. Is the CPE radio reachable and associated?
2. Is the radio's LAN link up?
3. Is the router answering?

### Tower (AP/sector) side

- **CPE associated, normal signal, management responds** → wireless and radio fine; problem is behind the radio.
- **CPE not associated/unreachable** → problem is radio, cable, power, or RF link, not the router. Work that first (sections 1–5).
- **Upstream systems:**
  - DHCP lease for router MAC: current or expired?
  - PPPoE session: up/down, when dropped, disconnect reason.
  - RADIUS accounting: session stop time.
  - Monitoring: when did ping alerts start?
  - **TR-069/ACS** (ISP-managed routers): last check-in time.

### Customer radio (CPE) side

- **LAN link status:**
  - **Down:** router off, unplugged, or WAN port/cable failed.
  - **Up:** router has power and connection but may be hung or booting.
- **Rx counters, bridge table, ARP** (section 6): link up, no traffic, stale MAC, incomplete ARP → powered but not functioning.
- **Ping and ARP ping from the radio.** Many routers **ignore WAN-side ping by default**, so failed ping alone doesn't prove offline. ARP ping, fresh MAC entry, or incrementing counters are more reliable.
- **Log timing:** when the LAN link dropped or traffic stopped; compare with the customer's account.

### Ask the customer

- Router lights on? Which ones, what colour? (Power, WAN/Internet, Wi-Fi.)
- Plugged into power and the injector's LAN port?
- Power outage? Router on a power bar that was switched off?
- Can a computer plugged directly into the injector get online?

### How to read it

- **Radio fine, LAN link down:** router off, unplugged, or WAN port/cable failed.
- **Radio fine, LAN up, no traffic/ARP:** router hung. Power cycle.
- **Radio fine, router answers, but no lease/session:** router on but WAN not getting service (section 6 or 9).
- **Radio not reachable:** not a router problem; work the radio and link.

### Escalation note example

> CPE associated at -59 dBm, reachable. LAN link down since 14:32. No lease activity since then. Customer confirms router lights are off; power bar had been switched off during renovations. Power restored, router obtained lease, service confirmed.

---

## 9. Boot order: have customer devices come online in the wrong order?

### Why boot order matters

After a power outage or full unplug, devices return at different speeds. A consumer router often boots in 30–60 seconds; an outdoor radio may take a minute or two to boot **and** reassociate with the tower. The router asks for its WAN address before the radio has a path, gets no answer, and may:

- give up and sit without a WAN address,
- retry only after a long delay (sometimes many minutes, or not until rebooted),
- self-assign 169.254.x.x and stay stuck,
- or, in router-mode setups, pick up an address from the wrong source.

**Mesh systems** have a similar problem: a satellite node booting before the main node may fail to join and create its own separate network, or devices end up on the wrong node/SSID.

### Tower (AP/sector) side

- **CPE association time** (link uptime) compared with router lease/session timing.
- **Upstream lease/session:** CPE reassociated at 03:12 but no DHCP discover, lease, or PPPoE session from the router MAC afterward → router tried too early and never retried successfully.
- **Neighbouring CPEs:** many reassociating at the same moment confirms an area power outage, the most common trigger. Expect other customers calling with the same issue.

### Customer radio (CPE) side

- **Radio uptime** vs **wireless association time** vs **LAN link-up time.** LAN link up well before the radio associated → router was ready first and likely asked for its lease with no path upstream.
- **Radio logs:** DHCP discovers (router mode) or router-MAC traffic before the wireless link came up, and nothing after.
- **Radio DHCP server** (router mode): no lease or expired offer for the router after boot.
- **MAC table:** router MAC present (router alive) but no lease or session.

### What the customer can check

- **Router WAN status:** no address, 0.0.0.0, or 169.254.x.x.
- **Router lights:** power and Wi-Fi on, Internet/WAN light off, amber, or red.
- **Recent power event:** outage, flicker, breaker trip?
- **Mesh nodes:** all connected in the app? Devices on an unexpected network name?

### The fix

Restart in order, letting each layer settle:

1. **Radio (PoE injector) first.** Wait for full boot and tower reconnection, usually ~2 minutes. Confirm association if visible.
2. **Router next.** Wait for WAN address and internet connectivity.
3. **Mesh nodes, switches, extenders.**
4. **Client devices last**, or reconnect any stuck on the wrong network.

For recurring problems: suggest a UPS for radio and router, or advise the customer to power cycle the router after outages once the radio is back up.

### Escalation note example

> Area power outage ~03:10; multiple CPEs on the sector reassociated 03:12–03:14. Customer's CPE associated 03:13, but router's LAN link came up 03:11 and no DHCP request from router MAC since. Router showing 169.254.x.x on WAN. Power-cycled router after confirming CPE up; lease obtained, service restored. Advised customer on restart order after outages.

---

## Quick reference: the pattern across all nine

| Symptom pattern | Likely cause |
|---|---|
| Signal down, both directions, sudden and permanent | Misalignment |
| Signal down, both directions, tracks rain, recovers after | Rain fade (or thin margin) |
| Signal down, both directions, wobbles in wind, seasonal or growing | Foliage |
| Noise up rather than signal down, often one-sided, time-of-day patterns | Interference |
| RF perfect, Ethernet side bad (errors, slow link, reboots) | Cable |
| RF and cable fine, router present but no lease, session, or traffic | Router lease/communication problem |
| Everything works except specific apps (games, VoIP, VPN, port forwards) | NAT layering |
| Radio fine, nothing behind it | Router offline |
| Radio fine after an outage, router alive but no WAN address | Boot order |
