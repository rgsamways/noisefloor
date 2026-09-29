const FALLBACK_OFFLINE_THRESHOLD_MS = 15 * 60 * 1000;

export interface GenieAcsDeviceStatus {
  status: "online" | "offline";
  lastInform: string;
}

// design.md's threshold decision: a device is "offline" once it's missed
// roughly two of its own expected check-ins, not a single fixed window for
// every device — check-in intervals vary by vendor/config.
export function computeDeviceStatus(
  lastInform: string,
  periodicInformIntervalSeconds: number | undefined,
  now: Date = new Date(),
): GenieAcsDeviceStatus {
  const thresholdMs = periodicInformIntervalSeconds ? periodicInformIntervalSeconds * 2 * 1000 : FALLBACK_OFFLINE_THRESHOLD_MS;
  const elapsedMs = now.getTime() - new Date(lastInform).getTime();
  return { status: elapsedMs <= thresholdMs ? "online" : "offline", lastInform };
}
