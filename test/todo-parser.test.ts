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

  it("should parse an incomplete todo with priority", () => {
    const input = "(B) 2023-09-30 Start the task +project3 @context3";
    const result = parse(input);
    expect(result.ast).not.to.be.null;
    expect(result.ast?.value.completed).to.be.false;
    expect(result.ast?.value.priority).to.equal("(B)");
    expect(result.ast?.value.projects).to.include("project3");
    expect(result.ast?.value.contexts).to.include("context3");
  });

  it("should parse a completed todo with projects and contexts", () => {
    const input = "x 2023-10-01 2023-09-30 Complete the task +project4 @context4";
    const result = parse(input);
    expect(result.ast).not.to.be.null;
    expect(result.ast?.value.completed).to.be.true;
    expect(result.ast?.value.projects).to.include("project4");
    expect(result.ast?.value.contexts).to.include("context4");
  });
});

describe("Additional Todo Parser Tests", () => {
  it("should parse a completed todo with projects, contexts, and ID", () => {
    const input = "x 2023-10-01 2022-09-15 Finish project +work +urgent @office id:PROJ-123";
    const result = parse(input);
    expect(result.ast).not.to.be.null;
    expect(result.ast?.value.completed).to.be.true;
    expect(result.ast?.value.completionDate).to.equal("2023-10-01");
    expect(result.ast?.value.createdDate).to.equal("2022-09-15");
    expect(result.ast?.value.projects).to.include.members(["work", "urgent"]);
    expect(result.ast?.value.contexts).to.include("office");
    expect(result.ast?.value.id).to.equal("PROJ-123");
  });

  it("should parse an incomplete todo with priority, projects, contexts, and ID", () => {
    const input = "(B) 2023-01-01 Start new year resolution +personal @home id:NY2023";
    const result = parse(input);
    expect(result.ast).not.to.be.null;
    expect(result.ast?.value.completed).to.be.false;
    expect(result.ast?.value.priority).to.equal("(B)");
    expect(result.ast?.value.createdDate).to.equal("2023-01-01");
    expect(result.ast?.value.projects).to.include("personal");
    expect(result.ast?.value.contexts).to.include("home");
    expect(result.ast?.value.id).to.equal("NY2023");
  });
});
