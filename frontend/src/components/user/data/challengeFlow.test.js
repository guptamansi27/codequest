import { challengeNodes, challenges, galaxies, galaxyContent } from "./challengeFlow";

describe("challengeFlow static data", () => {
  test("defines galaxy metadata and matching content", () => {
    expect(galaxies.map((galaxy) => galaxy.id)).toEqual(["html", "css", "react"]);
    expect(galaxyContent.html).toMatchObject({
      title: "HTML Galaxy",
      subtitle: expect.stringContaining("foundations"),
    });
    expect(galaxyContent.javascript.title).toBe("JavaScript Galaxy");
  });

  test("connects challenge nodes to challenge definitions", () => {
    const challengeNodeIds = challengeNodes.map((node) => node.id);

    expect(challengeNodeIds).toContain("html-1");
    expect(challengeNodeIds).toContain("javascript-1");
    expect(challenges["html-1"]).toMatchObject({
      galaxy: "html",
      title: "Create a Semantic HTML Structure",
      starterCode: expect.objectContaining({ html: expect.any(String) }),
    });
    expect(challenges["javascript-1"].starterCode.javascript).toContain("reverseString");
  });

  test("includes final project definitions and pass/fail test cases", () => {
    expect(challenges["html-final"].type).toBe("Final Project");
    expect(challenges["css-final"].difficulty).toBe("Hard");
    expect(challenges["react-final"].starterCode.javascript).toContain("function App");

    const allTestCases = Object.values(challenges).flatMap((challenge) => challenge.testCases);
    expect(allTestCases.some((testCase) => testCase.status === "passed")).toBe(true);
    expect(allTestCases.some((testCase) => testCase.status === "failed")).toBe(true);
  });
});
