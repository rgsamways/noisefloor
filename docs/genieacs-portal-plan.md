# Plan: tier-1 support portal in noisefloor, backed by GenieACS's REST API

> Companion doc to `docs/genieacs-sagemcom-trial-handoff.md` in this same folder — read that first for the full backstory (Sagemcom dead end, TP-Link cost-blocked, MikroTik hAP Lite proof of concept working end-to-end as of 2026-09-28). This doc picks up from "GenieACS works, now build something on top of it."

## Goal

A tier-1 support portal, living in noisefloor, that lets support staff look up a customer, see whether their equipment is online, and take basic remote actions (reboot, Wi-Fi password reset) — without needing to touch GenieACS's own generic admin UI or know a device's serial number.

## Current proof-of-concept state (2026-09-28)

- GenieACS is running on Robin's laptop (Docker Compose, `genieacs` 1.2.16.0 + `mongo` 8.0). **This is not a permanent home — see prerequisite #1 below.**
- A MikroTik hAP Lite TC bench unit is successfully checking in via TR-069 and is fully controllable: confirmed working reboot capability, confirmed working real-time "connection request" (instant remote action, not just polling on the next periodic inform).
- Sample of the actual NBI response shape (`GET http://<genieacs-host>:7557/devices/`), useful for designing the noisefloor-side data layer:

```json
[
  {
    "_id": "E48D8C-hAP%20lite-8CE6085532C7",
    "_deviceId": {
      "_Manufacturer": "MikroTik",
      "_OUI": "E48D8C",
      "_ProductClass": "hAP lite",
      "_SerialNumber": "8CE6085532C7"
    },
    "_lastInform": "2026-09-28T19:59:27.560Z",
    "_lastBoot": "2026-09-28T19:51:48.611Z",
    "_registered": "2026-09-28T19:51:48.611Z",
    "Device": {
      "DeviceInfo": { "HardwareVersion": {"_value": "v1.0"}, "SoftwareVersion": {"_value": "6.49.18"} },
      "ManagementServer": { "PeriodicInformInterval": {"_value": 300}, "...": "..." }
    }
  }
]
```

Key things to notice: the device's identity is `_id` (a synthesized string) plus a structured `_deviceId` (manufacturer/OUI/product class/serial — this is the stable identifier to key off of, not `_id`). Online/offline is derived from `_lastInform` recency, not an explicit boolean field. The full TR-069 parameter tree (Wi-Fi, WAN, hosts, etc.) sits under `Device.*`, structured per the vendor's data model (TR-181 for newer devices, TR-098 for older) — the exact paths will differ by device manufacturer, so any UI reading "Wi-Fi SSID" or "connected hosts" needs to handle that per product class/vendor rather than assuming one fixed path works for every device type.

## Prerequisites before building anything real

1. **GenieACS needs a permanent, always-on home** — not a laptop. Customer routers in the field need a stable place to phone home to; if the host sleeps, reboots, or drops off the network, every managed device loses its ACS. This should move to real infrastructure (an NRN-hosted server or small cloud VM) with a static address and HTTPS before any noisefloor integration matters for real use. Prototyping against the laptop instance for API exploration is fine in the meantime.
2. **Decide the customer-to-device mapping mechanism.** GenieACS has no concept of "customer" — only devices (identified by manufacturer/OUI/product class/serial, as above). The portal's entire "look up a customer" workflow depends on some link between a customer record and a device identity. Simplest approach: tag each device in GenieACS (via the NBI's tagging endpoints) with the customer's account ID at install/provisioning time, then the portal's lookup is: customer search → resolve tag → device ID → NBI calls. This is a real design decision, not a technical detail — make it explicit before writing UI code.
3. **Secure the network path.** GenieACS's NBI (port 7557) has no built-in authentication by default — it's designed to be network-isolated, not exposed directly to end users or the public internet. noisefloor's backend should be the only thing that talks to it directly (over a private network path, VPN, or firewalled to noisefloor's server IP); the noisefloor frontend should never call the NBI directly from the browser.

## Suggested build order

1. **Read-only, thin slice**: noisefloor backend endpoint that takes a customer identifier, resolves it to a device ID (via whatever tagging/mapping scheme from prerequisite #2), calls GenieACS's NBI, and returns online/offline + last-inform time. Get this working against the bench GenieACS instance first.
2. **Add one write action**: reboot. Lower risk than a config change (nothing to get wrong, it just power-cycles), and it exercises the same "send a task, confirm it executed" pattern that every other write action will need (the earlier bench trial confirmed GenieACS's "Summon"/connection-request mechanism works — same primitive a reboot task rides on).
3. **Add Wi-Fi SSID/password reset** — a real config write (`setParameterValues`), higher stakes than reboot since a mistake changes what the customer connects to, so build this after the reboot path has been trusted in practice.
4. **Signal/connected-devices display** — lowest priority; useful for diagnostics but not essential to the core "is this customer online, can I reboot them" workflow, and the parameter paths vary more by vendor so it's the most fragile piece to get right across NRN's mixed hardware fleet.

## Open question carried over from the other handoff doc

Still unconfirmed: whether NRN's fixed-wireless radios (a different device from the in-home router, per the other handoff doc) are managed via Ubiquiti's UISP, and whether that's a second/parallel data source worth surfacing in the same portal alongside GenieACS-managed routers. Worth resolving before finalizing the portal's data model, since "one customer, one device" may actually be "one customer, one router (GenieACS) + one radio (maybe UISP)."
