import type { Stage } from "@noisefloor/shared";

// Stages 1-5 of case 001 — the foliage arc plus the RF-anomaly detour
// (stages 2/3), per NOISEFLOOR-OUTLINE.md §9. Stages 6-10 (the separate
// shaper-collapse subplot) stay deferred — see
// openspec/changes/radio-family-case-001-stages-2-3's design.md. Ids use
// their eventual final numbering so inserting 6-10 later doesn't require
// renumbering anything already played.
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
  title: "Why is the ceiling where it is?",
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

export const stages: Stage[] = [stage1, stage2, stage3, stage4, stage5];
