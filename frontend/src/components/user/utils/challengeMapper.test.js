import {
  getChallengeGalaxy,
  getChallengeModule,
  getChallengeStatus,
  getModuleProgress,
  isChallengeLive,
  isSubmissionPassed,
  isTechnologyUnlocked,
  mapBackendChallenge,
} from "./challengeMapper";

describe("challenge mapper", () => {
  test("maps backend module and technology values to frontend galaxies", () => {
    expect(getChallengeModule({ module_name: "javascript" })).toBe("JS");
    expect(getChallengeModule({ technology: "react" })).toBe("REACT");
    expect(getChallengeGalaxy({ technology: "css" })).toBe("css");
  });

  test("maps backend challenge data into workspace-ready frontend shape", () => {
    const challenge = mapBackendChallenge({
      id: 7,
      title: "Build a button",
      technology: "html",
      challenge_type: "CODE_CHALLENGE",
      difficulty: "Easy",
      description: "Create a CTA",
      xp_points: 25,
      is_chatbot_enabled: true,
      starter_code: "<button>Start</button>",
      test_cases: [
        {
          name: "Button exists",
          input_data: JSON.stringify({ message: "Render a button" }),
          expected_output: "Button exists",
          is_case_sensitive: false,
        },
      ],
    });

    expect(challenge).toMatchObject({
      id: "7",
      backendId: 7,
      galaxy: "html",
      title: "Build a button",
      xpPoints: 25,
      chatbotEnabled: true,
      workspaceType: "web",
      totalTestCount: 1,
    });
    expect(challenge.starterCode.javascript).toBe("<button>Start</button>");
    expect(challenge.validationRules[0].input).toBe("Render a button");
  });

  test("calculates submission status and module progress", () => {
    const challenges = [
      { id: 1, challenge_type: "CHALLENGE", module_name: "HTML", is_active: true },
      { id: 2, challenge_type: "CHALLENGE", module_name: "HTML", is_active: true },
      { id: 3, challenge_type: "PROJECT", module_name: "HTML", is_active: true },
    ];
    const submissions = [{ challenge: 1, is_passed: true }];

    expect(isSubmissionPassed(submissions, 1)).toBe(true);
    expect(isSubmissionPassed(submissions, 2)).toBe(false);
    expect(getModuleProgress(challenges, submissions, "HTML")).toEqual({
      total: 2,
      completed: 1,
      progress: 50,
      isComplete: false,
    });
  });

  test("detects challenge schedule state and unlock rules", () => {
    const now = Date.now();
    const active = {
      is_active: true,
      start_time: new Date(now - 1000).toISOString(),
      end_time: new Date(now + 1000).toISOString(),
    };
    const upcoming = {
      is_active: true,
      start_time: new Date(now + 1000).toISOString(),
      end_time: new Date(now + 2000).toISOString(),
    };

    expect(getChallengeStatus({ is_active: false })).toBe("expired");
    expect(getChallengeStatus(active)).toBe("active");
    expect(getChallengeStatus(upcoming)).toBe("upcoming");
    expect(isChallengeLive(active)).toBe(true);
    expect(isTechnologyUnlocked({ challenge_type: "PROJECT" }, [], [])).toBe(true);
  });

  test("locks later modules until previous modules are complete", () => {
    const challenges = [
      { id: 1, challenge_type: "CHALLENGE", module_name: "HTML", is_active: true },
      { id: 2, challenge_type: "CHALLENGE", module_name: "CSS", is_active: true },
    ];

    expect(isTechnologyUnlocked(challenges[1], challenges, [])).toBe(false);
    expect(isTechnologyUnlocked(challenges[1], challenges, [{ challenge: 1, is_passed: true }])).toBe(true);
  });
});
