import { validateSubBatchInput } from "./batchService";

describe("batchService validation", () => {
  test("requires sub-batches to match the selected parent batch prefix", () => {
    expect(validateSubBatchInput("B1,B2", "B")).toEqual({ names: ["B1", "B2"], error: "" });
    expect(validateSubBatchInput("A3", "B")).toEqual({
      names: ["A3"],
      error: "Sub-batch 'A3' must start with Batch B.",
    });
  });
});
