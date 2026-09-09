export const formatTestRunSummary = (evaluation) => {
  const passed = Number(evaluation?.passed || 0);
  const total = Number(evaluation?.total || 0);

  if (!total) {
    return "No test cases configured";
  }

  if (passed === total) {
    return `All ${passed}/${total} Test Cases Passed`;
  }

  return `${passed}/${total} Test Cases Passed`;
};

export const formatSubmissionSummary = (data, fallbackEvaluation) => {
  const passed = Number(data?.passed ?? fallbackEvaluation?.passed ?? 0);
  const total = Number(data?.total ?? fallbackEvaluation?.total ?? 0);
  const summary = formatTestRunSummary({ passed, total });

  if (data?.submissionSuccess) {
    return data?.xpEarned
      ? `${summary}. You earned ${data.xpEarned} XP.`
      : summary;
  }

  return summary;
};
