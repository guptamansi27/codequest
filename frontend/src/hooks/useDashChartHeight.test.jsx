import { act, render, screen } from "@testing-library/react";
import { useDashChartHeight } from "./useDashChartHeight";

function HeightProbe({ options }) {
  const height = useDashChartHeight(options);
  return <output aria-label="chart-height">{height}</output>;
}

describe("useDashChartHeight", () => {
  const setInnerHeight = (value) => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value,
    });
  };

  test("clamps chart height between min and max and responds to resize", () => {
    setInnerHeight(1000);

    render(<HeightProbe options={{ min: 180, max: 260, ratio: 0.25 }} />);
    expect(screen.getByLabelText("chart-height")).toHaveTextContent("250");

    act(() => {
      setInnerHeight(400);
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByLabelText("chart-height")).toHaveTextContent("180");

    act(() => {
      setInnerHeight(2000);
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByLabelText("chart-height")).toHaveTextContent("260");
  });

  test("uses default sizing options", () => {
    setInnerHeight(900);

    render(<HeightProbe />);

    expect(screen.getByLabelText("chart-height")).toHaveTextContent("205");
  });
});
