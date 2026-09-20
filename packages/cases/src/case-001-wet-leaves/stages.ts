import type { Stage } from "@noisefloor/shared";

// Stages 1, 4, and 5 of case 001 — the foliage arc only, per
// NOISEFLOOR-OUTLINE.md §9 and openspec/changes/case-engine-minimal-playable's
// design.md. Ids use their eventual final numbering so inserting stages 2/3
// and 6-10 later doesn't require renumbering anything already played.
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

export const stages: Stage[] = [stage1, stage4, stage5];
