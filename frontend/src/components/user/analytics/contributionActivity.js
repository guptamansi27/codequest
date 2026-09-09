const toDateKey = (date) => {
  const local = new Date(date);
  local.setHours(12, 0, 0, 0);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildContributionActivity = (submissions = [], challenges = []) => {
  const challengeXp = new Map(
    challenges.map((challenge) => [
      Number(challenge.id),
      Number(challenge.xp_points || challenge.xpPoints || 0),
    ]),
  );

  return submissions.reduce((activity, submission) => {
    if (!submission.submitted_at) return activity;

    const key = toDateKey(submission.submitted_at);
    const current = activity.get(key) || {
      total: 0,
      accepted: 0,
      completed: 0,
      xp: 0,
    };
    const accepted = Boolean(submission.is_passed);
    const challengeId = Number(submission.challenge);

    activity.set(key, {
      total: current.total + 1,
      accepted: current.accepted + (accepted ? 1 : 0),
      completed: current.completed + (accepted ? 1 : 0),
      xp: current.xp + Number(submission.earned_xp || (accepted ? challengeXp.get(challengeId) : 0) || 0),
    });

    return activity;
  }, new Map());
};

export const getContributionLevel = (activity) => {
  if (!activity?.total) return 0;
  const score = activity.accepted * 2 + activity.total + Math.floor(activity.xp / 50);
  if (score >= 10) return 4;
  if (score >= 6) return 3;
  if (score >= 3) return 2;
  return 1;
};

export { toDateKey };
