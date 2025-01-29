import { parse } from "../src/todo-parser.js";
import { expect } from "chai";

describe("Todo Parser", () => {
  it("should parse a completed todo", () => {
    const input =
      "x 2023-10-01 2023-09-30 Complete the task +project1 @context1";
    const result = parse(input);
    expect(result.ast).not.to.be.null;
    expect(result.ast?.value.completed).to.be.true;
  });

  it("should parse an incomplete todo", () => {
    const input = "(A) 2023-09-30 Start the task +project2 @context2";
    const result = parse(input);
    expect(result.ast).not.to.be.null;
    expect(result.ast?.value.completed).to.be.false;
  });
});
