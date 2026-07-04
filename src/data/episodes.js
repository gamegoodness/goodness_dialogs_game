/**
 * episodes.js — episode registry.
 *
 * To add Episode 2: create src/data/episode2.js exporting an array of moments
 * (same shape as EPISODE_1), import it here, and add an entry to EPISODES.
 * The engine is episode-agnostic — it just plays whichever episode is active.
 */

import { EPISODE_1 } from './scenarios.js';

export const EPISODES = [
  {
    id: 1,
    name: 'Empathy',
    subtitle: 'Six real-life moments.<br>Real choices. Real consequences.<br>No perfect answers.',
    meta: 'Ages 6 to 12 · 10 to 15 minutes · Foundation of Goodness',
    curriculum: 'Foundation of Goodness · Good Life Ladders · Episode 1: Empathy',
    // "For teachers and parents" prompts shown on the final screen.
    discussion: [
      "Which moment in Milo's day felt most real to you?",
      'In The Test, there was no perfect choice. How do you decide when two good values conflict?',
      'Which virtue do you most want to practise this week, and how?',
    ],
    moments: EPISODE_1,
  },
];

/** The episode currently wired to the title screen. */
export const ACTIVE_EPISODE = EPISODES[0];
