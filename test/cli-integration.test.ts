import { expect } from "chai";
import { TodoCore } from "../src/todo-core.js";
import tmp from 'tmp-promise';
import fs from "fs/promises";
import path from "path";

import { parse } from "../src/todo-parser.js";

describe("CLI Integration Tests", () => {
    let tmpFile: tmp.FileResult;
    let originalTodoFile: string | undefined;

    beforeEach(async () => {
        // バックアップを取る
        originalTodoFile = process.env.TODO_FILE;
        // 一時ファイルを作成
        tmpFile = await tmp.file();
        process.env.TODO_FILE = tmpFile.path;

        // テストの開始時に必ずファイルをクリア
        await TodoCore.clearFile();
    });

    afterEach(async () => {
        // 環境変数を元に戻す
        if (originalTodoFile) {
            process.env.TODO_FILE = originalTodoFile;
        } else {
            delete process.env.TODO_FILE;
        }
        // 一時ファイルを削除
        await tmpFile.cleanup();
    });

    it("should initialize todo file", async () => {
        const exists = await fs.access(tmpFile.path)
            .then(() => true)
            .catch(() => false);
        expect(exists).to.be.true;
    });

    it("should add a task with priority and verify file content", async () => {
        await TodoCore.addTask("Test task", "A", undefined, undefined, "TEST-1");

        const content = await fs.readFile(tmpFile.path, "utf-8");
        expect(content).to.include("(A)");
        expect(content).to.include("Test task");
        expect(content).to.include("id:TEST-1");
    });

    it("should mark task as done and verify file content", async () => {
        await TodoCore.addTask("Test task", "A", undefined, undefined, "TEST-1");
        await TodoCore.markTasksDone(["TEST-1"]);

        const content = await fs.readFile(tmpFile.path, "utf-8");
        expect(content).to.match(/^x \d{4}-\d{2}-\d{2}/); // 完了日のフォーマット確認
    });

    it("should list all tasks correctly including completed ones", async () => {
        // 未完了タスクを追加
        await TodoCore.addTask("Task 1", "A", undefined, undefined, "TEST-1");
        await TodoCore.addTask("Task 2", "B", undefined, undefined, "TEST-2");

        // Task 1を完了としてマーク
        await TodoCore.markTasksDone(["TEST-1"]);

        // ファイルの内容を直接確認
        const content = await fs.readFile(tmpFile.path, "utf-8");
        const lines = content.trim().split("\n");

        // 各行を解析して正しい形式かチェック
        for (const line of lines) {
            const parsed = parse(line);
            expect(parsed.ast, `Failed to parse line: ${line}`).to.not.be.null;

            const todo = parsed.ast?.value;
            if (todo?.id === "TEST-1") {
                expect(todo.completed, "Task 1 should be marked as completed").to.be.true;
                expect(todo.priority, "Completed task should not have priority").to.be.undefined;
                expect(todo.completionDate, "Completed task should have completion date").to.match(/^\d{4}-\d{2}-\d{2}$/);
            } else if (todo?.id === "TEST-2") {
                expect(todo.completed, "Task 2 should not be marked as completed").to.be.false;
                expect(todo.priority).to.equal("B");
            }
        }

        // TodoCore.listTasks()を使った確認
        const tasks = await TodoCore.listTasks({ showCompleted: true });
        expect(tasks).to.have.lengthOf(2);

        // タスクの完了状態を確認
        const task1 = tasks.find(t => t.id === "TEST-1");
        const task2 = tasks.find(t => t.id === "TEST-2");

        expect(task1?.completed, "Task 1 should be completed").to.be.true;
        expect(task1?.priority, "Completed task should not have priority").to.be.undefined;
        expect(task2?.completed, "Task 2 should not be completed").to.be.false;
        expect(task2?.priority).to.equal("B");
    });

    it("should delete specific tasks", async () => {
        await TodoCore.addTask("Task 1", "A", undefined, undefined, "TEST-1");
        await TodoCore.addTask("Task 2", "B", undefined, undefined, "TEST-2");

        await TodoCore.deleteTasks(["TEST-1"]);
        const tasks = await TodoCore.listTasks({ showCompleted: true });
        expect(tasks).to.have.lengthOf(1);
        expect(tasks[0].id).to.equal("TEST-2");
    });

    it("should delete all tasks", async () => {
        await TodoCore.addTask("Task 1", "A");
        await TodoCore.addTask("Task 2", "B");

        await TodoCore.deleteAllTasks();
        const tasks = await TodoCore.listTasks({ showCompleted: true });
        expect(tasks).to.have.lengthOf(0);

        // ファイルは存在するが空であることを確認
        const exists = await fs.access(tmpFile.path)
            .then(() => true)
            .catch(() => false);
        expect(exists).to.be.true;

        const content = await fs.readFile(tmpFile.path, "utf-8");
        expect(content.trim()).to.equal("");
    });

    // 新機能のテストを追加
    it("should filter tasks by project", async () => {
        await TodoCore.addTask("Task 1", "A", ["ProjectA"], undefined, "TEST-1");
        await TodoCore.addTask("Task 2", "B", ["ProjectB"], undefined, "TEST-2");

        const tasks = await TodoCore.listTasks({ project: "ProjectA" });
        expect(tasks).to.have.lengthOf(1);
        expect(tasks[0].projects).to.include("ProjectA");
    });

    it("should filter tasks by context", async () => {
        await TodoCore.addTask("Task 1", "A", undefined, ["home"], "TEST-1");
        await TodoCore.addTask("Task 2", "B", undefined, ["work"], "TEST-2");

        const tasks = await TodoCore.listTasks({ context: "home" });
        expect(tasks).to.have.lengthOf(1);
        expect(tasks[0].contexts).to.includes("home");
    });

    it("should filter tasks by priority", async () => {
        await TodoCore.addTask("Task 1", "A", undefined, undefined, "TEST-1");
        await TodoCore.addTask("Task 2", "B", undefined, undefined, "TEST-2");

        const tasks = await TodoCore.listTasks({ priority: "A" });
        expect(tasks).to.have.lengthOf(1);
        expect(tasks[0].priority).to.equal("A");
    });

    // Bulk API tests
    it("should add multiple tasks in bulk", async () => {
        const bulkTasks = [
            {
                task: "Task 1",
                priority: "A",
                projects: ["ProjectA"],
                contexts: ["home"],
                id: "BULK-1"
            },
            {
                task: "Task 2",
                priority: "B",
                projects: ["ProjectB"],
                contexts: ["work"],
                id: "BULK-2"
            }
        ];

        await TodoCore.bulkAddTasks(bulkTasks);

        const tasks = await TodoCore.listTasks({});
        expect(tasks).to.have.lengthOf(2);
        expect(tasks.map(t => t.id)).to.include("BULK-1");
        expect(tasks.map(t => t.id)).to.include("BULK-2");

        const task1 = tasks.find(t => t.id === "BULK-1");
        expect(task1?.priority).to.equal("A");
        expect(task1?.projects).to.include("ProjectA");
        expect(task1?.contexts).to.include("home");

        const task2 = tasks.find(t => t.id === "BULK-2");
        expect(task2?.priority).to.equal("B");
        expect(task2?.projects).to.include("ProjectB");
        expect(task2?.contexts).to.include("work");
    });

    it("should reject bulk tasks with duplicate IDs", async () => {
        const bulkTasks = [
            {
                task: "Task 1",
                id: "BULK-1"
            },
            {
                task: "Task 2",
                id: "BULK-1"  // 同じID
            }
        ];

        try {
            await TodoCore.bulkAddTasks(bulkTasks);
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("Duplicate IDs in bulk tasks");
        }
    });

    it("should reject bulk tasks with invalid contexts format", async () => {
        const bulkTasks = [
            {
                task: "Task 1",
                contexts: ["@home"]  // @付きは不正
            }
        ];

        try {
            await TodoCore.bulkAddTasks(bulkTasks);
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("Contexts should not include '@' prefix");
        }
    });
});

describe("CLI Error Cases", () => {
    let tmpFile: tmp.FileResult;
    let originalTodoFile: string | undefined;

    beforeEach(async () => {
        originalTodoFile = process.env.TODO_FILE;
        tmpFile = await tmp.file();
        process.env.TODO_FILE = tmpFile.path;

        // テストの開始時に必ずファイルをクリア
        await TodoCore.clearFile();
    });

    afterEach(async () => {
        if (originalTodoFile) {
            process.env.TODO_FILE = originalTodoFile;
        } else {
            delete process.env.TODO_FILE;
        }
        await tmpFile.cleanup();
    });

    it("should handle invalid priority input", async () => {
        try {
            await TodoCore.addTask("Test task", "1"); // 数字は無効な優先度
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("Invalid priority");
        }
    });

    it("should handle duplicate task IDs", async () => {
        await TodoCore.addTask("Task 1", "A", undefined, undefined, "TEST-1");
        try {
            await TodoCore.addTask("Task 2", "B", undefined, undefined, "TEST-1");
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("Duplicate task ID");
        }
    });

    it("should handle non-existent task ID for completion", async () => {
        try {
            await TodoCore.markTasksDone(["NONEXISTENT"]);
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("Task not found");
        }
    });

    it("should handle non-existent task ID for deletion", async () => {
        try {
            await TodoCore.deleteTasks(["NONEXISTENT"]);
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("Task not found");
        }
    });
});
