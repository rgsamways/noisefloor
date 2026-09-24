import { KB_CATEGORIES, type KbCategory } from "@noisefloor/kb";

// Display labels for KB_CATEGORIES' kebab-case values — kept in apps/web
// since packages/kb's schema shouldn't own UI display strings.
export const KB_CATEGORY_LABELS: Record<KbCategory, string> = {
  "rf-fundamentals": "RF Fundamentals",
  "frequency-spectrum": "Frequency & Spectrum",
  "modulation-phy-capacity": "Modulation, PHY & Capacity",
  "antennas-rf-hardware": "Antennas & RF Hardware",
  "radios-field-hardware": "Radios & Field Hardware",
  "network-topology": "Network Topology & Architecture",
  "ethernet-poe-cabling": "Ethernet, PoE & Cabling",
  "ip-networking": "IP Networking & Addressing",
  "nat-routing-service-layer": "NAT, Routing & Service Layer",
  "protocols-management": "Protocols & Management",
  "diagnostics-monitoring": "Diagnostics & Monitoring",
  "environmental-effects": "Environmental & Propagation Effects",
  "operations-process": "Operations, Install & Process",
};

export const KB_CATEGORY_OPTIONS: readonly KbCategory[] = KB_CATEGORIES;
