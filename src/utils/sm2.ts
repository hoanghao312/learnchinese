export function calculateSM2(
  grade: number, // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
  oldEasiness: number | undefined = 2.5,
  oldRepetitions: number | undefined = 0,
  oldInterval: number | undefined = 0
) {
  let easiness = oldEasiness ?? 2.5;
  let repetitions = oldRepetitions ?? 0;
  let interval = oldInterval ?? 0; // in days
  let nextReviewDate = Date.now();

  // If first time learning
  if (repetitions === 0) {
    if (grade === 1) { // Again (<1m)
      repetitions = 0;
      interval = 0;
      nextReviewDate = Date.now() + 60 * 1000; // 1 minute
    } else if (grade === 2) { // Hard (<10m)
      repetitions = 0; // Still need to review again to graduate to known? Actually hard might keep it at 0 repetitions but delay 10m.
      interval = 0;
      nextReviewDate = Date.now() + 10 * 60 * 1000; // 10 minutes
    } else if (grade === 3) { // Good (1d)
      repetitions = 1;
      interval = 1;
      nextReviewDate = Date.now() + 1 * 24 * 60 * 60 * 1000; // 1 day
    } else if (grade === 4) { // Easy (4d)
      repetitions = 1;
      interval = 4;
      easiness += 0.15;
      nextReviewDate = Date.now() + 4 * 24 * 60 * 60 * 1000; // 4 days
    }
    return { easiness, interval, repetitions, nextReviewDate };
  }

  // Already learning/learned
  if (grade === 1) { // Again
    repetitions = 0;
    interval = 1;
    nextReviewDate = Date.now() + 1 * 24 * 60 * 60 * 1000;
  } else if (grade === 2) { // Hard
    interval = Math.max(1, Math.round(interval * 1.2));
    easiness = Math.max(1.3, easiness - 0.15);
    nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;
  } else if (grade === 3) { // Good
    if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    repetitions += 1;
    interval = Math.min(36500, interval);
    nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;
  } else if (grade === 4) { // Easy
    if (repetitions === 1) {
      interval = 6 * 1.3;
    } else {
      interval = interval * easiness * 1.3;
    }
    interval = Math.round(interval);
    easiness += 0.15;
    repetitions += 1;
    interval = Math.min(36500, interval);
    nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;
  }

  return { easiness, interval, repetitions, nextReviewDate };
}
