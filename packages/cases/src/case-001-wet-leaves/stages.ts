import type { Stage } from "@noisefloor/shared";

// All 10 stages of case 001, per NOISEFLOOR-OUTLINE.md §9: the foliage arc
// (1, 4, 5), the RF-anomaly detour (2, 3), and the shaper-collapse incident
// (6-10) — see openspec/changes/case-001-shaper-incident's design.md for
// why world.events only models two of the incident's five outline-listed
// events.
//
// Hypothesis-stage option ids are prefixed per stage (s1-*, s4-*) rather
// than reused a/b/c/d: calculatePathScore's revision-bonus heuristic
// compares raw option ids across stages in the same attempt, so two
// different stages' first options both being plain "a" would make a real
// revision (capacity theory -> foliage theory) look like the same answer
// restated. Found live in playtesting.

const stage1: Stage = {
  id: "s1",
  title: "What does this graph tell you about capacity?",
  reveal: [{ kind: "dashboard", family: "crm", view: "LinkCapacityChart", worldSlice: "24h" }],
  prompt: {
    kind: "hypothesis",
    allowFreeText: true,
    options: [
      { id: "s1-capacity-capped", label: "The link is capacity-capped, somewhere around 60-65 Mbps" },
      { id: "s1-usage-near-max", label: "The customer's usage is close to maxing out the link" },
      { id: "s1-radio-problem", label: "There's a problem with the radio link itself" },
      { id: "s1-nothing-unusual", label: "Nothing unusual — standard traffic pattern" },
    ],
  },
  rubric: {
    kind: "hybrid",
    scores: [
      {
        optionId: "s1-capacity-capped",
        score: 2,
        feedback: "Reasonable read of the chart — there's a real, if noisy, ceiling here.",
      },
      {
        optionId: "s1-usage-near-max",
        score: 0,
        feedback: "The used (green) portion never gets close to the ceiling — usage isn't the story.",
      },
      {
        optionId: "s1-radio-problem",
        score: 1,
        feedback: "Possible, but nothing in this chart points at the radio specifically yet.",
      },
      {
        optionId: "s1-nothing-unusual",
        score: 0,
        feedback: "There's a real pattern here worth naming, not nothing.",
      },
    ],
    criteria: {
      mustMention: ["capacity", "ceiling"],
      mustNotMention: [],
      bonus: ["noisy"],
    },
  },
  feedback: {
    text: "Good start — the chart shows a noisy but real ceiling, not a maxed-out pipe. Keep watching where that ceiling sits.",
  },
};

const stage2: Stage = {
  id: "s2",
  title: "What do you check next?",
  reveal: [
    { kind: "dashboard", family: "radio", view: "LinkHeader" },
    { kind: "dashboard", family: "radio", view: "SignalPanel" },
    { kind: "dashboard", family: "radio", view: "RateBar" },
  ],
  prompt: {
    kind: "nextCheck",
    options: [
      { id: "s2-realign", label: "Realign the dish" },
      { id: "s2-widen-channel", label: "Widen the channel" },
      { id: "s2-check-history", label: "Check the signal history" },
      { id: "s2-replace-radio", label: "Replace the radio" },
      { id: "s2-nothing-yet", label: "Nothing yet — capacity looks fine as is" },
    ],
  },
  rubric: {
    kind: "options",
    scores: [
      {
        optionId: "s2-realign",
        score: 1,
        feedback:
          "Worth keeping in mind given the chain imbalance, but not the first move — check what the signal's done over time before touching hardware.",
      },
      {
        optionId: "s2-widen-channel",
        score: 0,
        feedback: "Channel width is a sector-wide decision, not something to reach for on one customer's ticket.",
      },
      {
        optionId: "s2-check-history",
        score: 3,
        feedback:
          "Right call — 20 MHz at 6X on a TDD link already explains this ceiling, so the next useful step is history, not a truck roll.",
      },
      { optionId: "s2-replace-radio", score: 0, feedback: "Nothing here points at failed hardware yet." },
      {
        optionId: "s2-nothing-yet",
        score: 1,
        feedback: "The capacity number is explained, but the chain imbalance and −69 dBm at 400 m are still worth a second look.",
      },
    ],
  },
  feedback: {
    text: "The 20 MHz / 6X / TDD math already explains the capacity ceiling — that part isn't a mystery. What's still unexplained is the 5 dB chain imbalance and a −69 dBm signal at only 400 m, and the way to chase that is history, not a dispatch.",
  },
};

const stage3: Stage = {
  id: "s3",
  title: "Should this be a dispatch?",
  reveal: [{ kind: "dashboard", family: "radio", view: "DeviceDetails", worldSlice: "cpe" }],
  prompt: {
    kind: "action",
    options: [
      { id: "s3-dispatch-now", label: "Dispatch a truck now" },
      { id: "s3-note-and-monitor", label: "Note the findings, don't dispatch yet" },
      { id: "s3-remote-fix", label: "Try to fix it remotely first" },
      { id: "s3-dispatch-bundle", label: "Hold off, but flag it to bundle with any future truck roll" },
    ],
  },
  rubric: {
    kind: "options",
    scores: [
      {
        optionId: "s3-dispatch-now",
        score: 0,
        feedback: "A marginal cable SNR and high memory aren't on their own worth a truck roll — nothing here is actively broken yet.",
      },
      {
        optionId: "s3-note-and-monitor",
        score: 3,
        feedback:
          "Right instinct — note the marginal cable SNR, high memory, and router-mode uptime, but none of it demands a dispatch by itself.",
      },
      {
        optionId: "s3-remote-fix",
        score: 1,
        feedback: "There's not really a remote fix for a marginal cable run — noting it for the next visit is more useful than chasing it now.",
      },
      {
        optionId: "s3-dispatch-bundle",
        score: 2,
        feedback: "Reasonable — if a truck ends up going out for another reason, bundle this in rather than triggering a dedicated visit.",
      },
    ],
  },
  feedback: {
    text: "Cable SNR marginal, memory running hot, and the CPE in router mode are all worth a note in the ticket — none of them, alone or together, justify a dispatch today.",
  },
};

const stage4: Stage = {
  id: "s4",
  title: "This feels telling.",
  reveal: [{ kind: "dashboard", family: "crm", view: "LinkCapacityChart", worldSlice: "1y" }],
  prompt: {
    kind: "hypothesis",
    allowFreeText: true,
    options: [
      { id: "s4-foliage", label: "Seasonal signal loss from foliage growth" },
      { id: "s4-realign", label: "The radio needs to be realigned" },
      { id: "s4-hardware-failing", label: "The AP or CPE hardware is failing" },
    ],
  },
  rubric: {
    kind: "hybrid",
    scores: [
      {
        optionId: "s4-foliage",
        score: 3,
        feedback: "This is it — the late-May cliff and the seasonal shape are foliage, not hardware.",
      },
      {
        optionId: "s4-realign",
        score: 1,
        feedback:
          "Worth considering, but a realignment wouldn't explain why this repeats every year on a calendar, not a compass heading.",
      },
      {
        optionId: "s4-hardware-failing",
        score: 0,
        feedback: "Hardware failure doesn't usually track the calendar this precisely.",
      },
    ],
    criteria: {
      mustMention: ["seasonal", "foliage"],
      mustNotMention: [],
      bonus: ["survey", "growth"],
    },
  },
  feedback: {
    text: "Right track — this is the wet-leaves story. The late-May transition and the extra few dB versus last year point at foliage growth, not hardware.",
  },
};

const stage5: Stage = {
  id: "s5",
  title: "What do you tell the customer?",
  reveal: [],
  prompt: {
    kind: "customerMessage",
    freeText: true,
    minWords: 25,
  },
  rubric: {
    kind: "freeText",
    criteria: {
      mustMention: ["seasonal", "survey"],
      mustNotMention: ["guarantee", "promise"],
      bonus: ["monitor"],
    },
  },
  feedback: {
    text: "Clear and honest — nothing broken, a seasonal cause explained in plain terms, and a next step without overpromising a fix.",
  },
};

const stage6: Stage = {
  id: "s6",
  title: "You changed the plan.",
  reveal: [
    {
      kind: "ticketNote",
      author: "T1 — J. Ahmed",
      text: "Cleaned up shaper profiles across the sector this morning, nothing that should affect anyone.",
      at: "11:52",
    },
    { kind: "colleagueSays", role: "T1", text: "I tried pulling up her session twice, it keeps timing out." },
    { kind: "colleagueSays", role: "field", text: "Truck's on another job, can't get out there till tomorrow." },
    { kind: "colleagueSays", role: "T2", text: "Radio side looks the same as it did last week. Nothing obviously wrong." },
  ],
  prompt: {
    kind: "hypothesis",
    allowFreeText: true,
    options: [
      { id: "s6-blown-hardware", label: "Blown horn / hardware failure" },
      { id: "s6-shaper-misconfigured", label: "Shaper misconfigured" },
      { id: "s6-memory", label: "CPE memory issue" },
      { id: "s6-ap-problem", label: "Problem with the AP" },
    ],
  },
  rubric: {
    kind: "hybrid",
    scores: [
      {
        optionId: "s6-blown-hardware",
        score: 0,
        feedback: "Hardware doesn't wait for someone to touch a config page — this started right when a change was made.",
      },
      {
        optionId: "s6-shaper-misconfigured",
        score: 3,
        feedback: "Right track — a shaper change lines up exactly with when this started.",
      },
      {
        optionId: "s6-memory",
        score: 1,
        feedback: "Worth checking, but the timing points at a specific change, not a slow resource leak.",
      },
      { optionId: "s6-ap-problem", score: 0, feedback: "Nothing here points at the AP side specifically." },
    ],
    criteria: {
      mustMention: ["change", "shaper"],
      mustNotMention: [],
      bonus: ["when"],
    },
  },
  feedback: {
    text: "Nobody's account plan changed today, but a shaper profile did — right around when the ticket started. That's the thread to pull, not another truck roll.",
  },
};

const stage7: Stage = {
  id: "s7",
  title: "Is she online?",
  reveal: [
    { kind: "dashboard", family: "crm", view: "RealtimePingModal", worldSlice: "M. Ferrier" },
    { kind: "dashboard", family: "crm", view: "RealtimePingModal", worldSlice: "Lakeside Inn" },
  ],
  prompt: {
    kind: "whatChanged",
    freeText: true,
  },
  rubric: {
    kind: "freeText",
    criteria: {
      mustMention: ["shaper"],
      mustNotMention: [],
      bonus: ["ping", "throughput"],
    },
  },
  feedback: {
    text: "Ping passing clean proves the path is up, not that it's fast — ICMP rides along fine even when a shaper's throttled everything else to a trickle. The only real change on record is the shaper edit at 11:52.",
  },
};

const stage8: Stage = {
  id: "s8",
  title: "I haven't done anything but I see traffic.",
  reveal: [{ kind: "dashboard", family: "nms", view: "DeviceOverview" }],
  prompt: {
    kind: "hypothesis",
    allowFreeText: true,
    options: [
      { id: "s8-real-usage", label: "That's real customer traffic" },
      { id: "s8-management-chatter", label: "That's just management/keepalive chatter" },
      { id: "s8-nms-bug", label: "The NMS graph itself is wrong" },
    ],
  },
  rubric: {
    kind: "hybrid",
    scores: [
      {
        optionId: "s8-real-usage",
        score: 0,
        feedback: "Real traffic isn't this perfectly symmetric — matching RX and TX is a management-channel signature, not a customer session.",
      },
      {
        optionId: "s8-management-chatter",
        score: 3,
        feedback:
          "Exactly — RX and TX collapsing to the same trickle at the same time is what a starved management channel looks like, not a customer using the link.",
      },
      {
        optionId: "s8-nms-bug",
        score: 1,
        feedback: "Possible in general, but this specific pattern (symmetric, timed with the shaper change) has a simpler explanation.",
      },
    ],
    criteria: {
      mustMention: ["symmetric", "management"],
      mustNotMention: [],
      bonus: ["kbit", "kbps"],
    },
  },
  feedback: {
    text: "Note the units too — that's kbit/s on this graph, not Mbps. Fifty of those is a trickle, not a typo.",
  },
};

const stage9: Stage = {
  id: "s9",
  title: "Get it back.",
  reveal: [{ kind: "dashboard", family: "nms", view: "DeviceManagePane" }],
  prompt: {
    kind: "action",
    options: [
      { id: "s9-web-ui", label: "Keep trying the web UI" },
      { id: "s9-restore-backup", label: "Restore the pre-incident backup" },
      { id: "s9-ssh-disable", label: "SSH in and disable the shaper directly" },
      { id: "s9-power-cycle", label: "Power-cycle the CPE again" },
      { id: "s9-escalate", label: "Escalate to T2 with the exact change made" },
    ],
  },
  rubric: {
    kind: "options",
    scores: [
      {
        optionId: "s9-web-ui",
        score: 0,
        feedback: "The web UI needs more than 50 kbit/s to load reliably — that's the wrong tool once the shaper's already choked the link.",
      },
      { optionId: "s9-restore-backup", score: 3, feedback: "This undoes the exact change that caused it — a clean fix." },
      {
        optionId: "s9-ssh-disable",
        score: 3,
        feedback:
          "Also a clean fix — SSH doesn't need the bandwidth a web session does, and disabling the shaper directly resolves the same root cause.",
      },
      {
        optionId: "s9-power-cycle",
        score: 0,
        feedback: "Already tried, per the notes — and a reboot won't undo a saved config change anyway.",
      },
      {
        optionId: "s9-escalate",
        score: 2,
        feedback: "Reasonable — naming the exact change when escalating is what actually gets it fixed fast, even if you're not the one making the fix.",
      },
    ],
  },
  feedback: {
    text: "Either a backup restore or an SSH session gets past the same wall a browser can't cross at 50 kbit/s — and naming the exact change (a shaper edit at 11:52) is what makes any of these actually fast.",
  },
};

const stage10: Stage = {
  id: "s10",
  title: "It's back.",
  reveal: [{ kind: "dashboard", family: "nms", view: "ApStationList" }],
  prompt: {
    kind: "ticketNote",
    freeText: true,
  },
  rubric: {
    kind: "freeText",
    criteria: {
      mustMention: ["shaper"],
      mustNotMention: [],
      bonus: ["kbit", "survey"],
    },
  },
  feedback: {
    text: "Good close — names the actual cause (a kbit/s shaper edit, not a hardware fault), the window it was down, and who fixed it, and carries the foliage survey forward rather than treating this as a separate, finished ticket.",
  },
};

export const stages: Stage[] = [stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8, stage9, stage10];
