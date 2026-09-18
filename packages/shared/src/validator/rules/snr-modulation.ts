import type { World } from "../../schemas/world.js";
import { CINR_CONSISTENCY_TOLERANCE_DB, MIN_CINR_DB_FOR_RATE } from "../constants.js";
import type { Tension } from "../types.js";

function checkCinrConsistency(
  side: "local" | "remote",
  signalDbm: number,
  noiseFloorDbm: number,
  cinrDb: number,
): Tension | null {
  const impliedCinr = signalDbm - noiseFloorDbm;
  const diff = Math.abs(impliedCinr - cinrDb);
  if (diff <= CINR_CONSISTENCY_TOLERANCE_DB) return null;

  return {
    rule: "snr.cinr-inconsistent-with-signal-noise",
    severity: "soft",
    fields: [`link.cinr${side === "local" ? "Local" : "Remote"}Db`, `link.signal${side === "local" ? "Local" : "Remote"}Dbm`, `link.noiseFloor${side === "local" ? "Local" : "Remote"}Dbm`],
    message: `${side === "local" ? "Local" : "Remote"} CINR is ${cinrDb} dB, but signal minus noise floor implies about ${impliedCinr.toFixed(1)} dB — a ${diff.toFixed(1)} dB gap. Worth double-checking these three numbers agree.`,
    resolutions: [{ description: "Adjust CINR to match signal minus noise floor, or vice versa" }],
  };
}

function checkRateAgainstCinr(side: "local" | "remote", rate: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, cinrDb: number): Tension | null {
  const required = MIN_CINR_DB_FOR_RATE[rate];
  if (cinrDb >= required) {
    // CINR supports this rate — but does it support a noticeably higher one?
    // A rate more than one step below what CINR could sustain is unusual
    // enough to want a stated cause (interference, error rate, config cap).
    const nextRate = (rate + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    const nextRequired = MIN_CINR_DB_FOR_RATE[nextRate];
    if (rate < 8 && cinrDb >= nextRequired) {
      return {
        rule: "snr.rate-below-cinr-capability",
        severity: "soft",
        fields: [`link.rate${side === "local" ? "Local" : "Remote"}`],
        message: `${side === "local" ? "Local" : "Remote"} CINR (${cinrDb} dB) could sustain a higher rate than ${rate}X. If the link is really running at ${rate}X, that needs a cause (interference, error rate, a config cap) — not a bare number.`,
        resolutions: [{ description: "Note a cause for the lower-than-supported rate, or raise the rate" }],
      };
    }
    return null;
  }

  return {
    rule: "snr.rate-exceeds-cinr",
    severity: "hard",
    fields: [`link.rate${side === "local" ? "Local" : "Remote"}`],
    message: `${side === "local" ? "Local" : "Remote"} ${rate}X needs roughly ${required} dB CINR; this link has ${cinrDb} dB. Either raise signal, lower noise, or drop the rate.`,
    resolutions: [
      { description: "Lower the modulation rate", field: `link.rate${side === "local" ? "Local" : "Remote"}` },
      { description: "Raise CINR (higher signal or lower noise floor)" },
    ],
  };
}

export function checkSnrModulation(world: World): Tension[] {
  const { link } = world;
  const tensions: Tension[] = [];

  const localCinrCheck = checkCinrConsistency("local", link.signalLocalDbm, link.noiseFloorLocalDbm, link.cinrLocalDb);
  if (localCinrCheck) tensions.push(localCinrCheck);

  const remoteCinrCheck = checkCinrConsistency(
    "remote",
    link.signalRemoteDbm,
    link.noiseFloorRemoteDbm,
    link.cinrRemoteDb,
  );
  if (remoteCinrCheck) tensions.push(remoteCinrCheck);

  const localRateCheck = checkRateAgainstCinr("local", link.rateLocal, link.cinrLocalDb);
  if (localRateCheck) tensions.push(localRateCheck);

  const remoteRateCheck = checkRateAgainstCinr("remote", link.rateRemote, link.cinrRemoteDb);
  if (remoteRateCheck) tensions.push(remoteRateCheck);

  return tensions;
}
