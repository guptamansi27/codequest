import { toDateKey } from "../analytics/contributionActivity";
import { isSubmissionPassed } from "./challengeMapper";

const isCodeOfDayChallenge = (challenge) =>
  String(challenge?.challenge_type || challenge?.challengeType || "").toUpperCase() === "CODE_OF_DAY";

const getChallengeDateKey = (challenge) => {
  const source = challenge?.start_time || challenge?.startTime || challenge?.end_time || challenge?.endTime;
  return source ? toDateKey(source) : null;
};

const getChallengeXp = (challenge) => Number(challenge?.xp_points || challenge?.xpPoints || 0);

export const buildCodeOfDayCompletionActivity = (challenges = [], submissions = []) => {
  const dailyChallenges = challenges.filter(isCodeOfDayChallenge);

  return dailyChallenges.reduce((activity, challenge) => {
    const dayKey = getChallengeDateKey(challenge);
    if (!dayKey || !isSubmissionPassed(submissions, challenge.id)) return activity;

    const current = activity.get(dayKey) || { total: 0, accepted: 0, completed: 0, xp: 0 };
    activity.set(dayKey, {
      total: current.total + 1,
      accepted: current.accepted + 1,
      completed: current.completed + 1,
      xp: current.xp + getChallengeXp(challenge),
    });

    return activity;
  }, new Map());
};

export const calculateCodeOfDayStreak = (completionActivity, today = new Date()) => {
  let streak = 0;
  const cursor = new Date(today);

  while (completionActivity.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getCodeOfDayStreak = (challenges = [], submissions = [], today = new Date()) =>
  calculateCodeOfDayStreak(buildCodeOfDayCompletionActivity(challenges, submissions), today);
