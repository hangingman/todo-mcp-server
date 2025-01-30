import { expect } from "chai";
import { TodoCore } from "../src/todo-core.js";
import tmp from 'tmp-promise';
import fs from "fs/promises";
import path from "path";

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

    it("should list all tasks correctly", async () => {
        await TodoCore.addTask("Task 1", "A", undefined, undefined, "TEST-1");
        await TodoCore.addTask("Task 2", "B", undefined, undefined, "TEST-2");

        const tasks = await TodoCore.listTasks(true);
        expect(tasks).to.have.lengthOf(2);
        expect(tasks[0].id).to.equal("TEST-2");  // 最新のタスクが先頭になる
        expect(tasks[0].priority).to.equal("B");
        expect(tasks[1].id).to.equal("TEST-1");
        expect(tasks[1].priority).to.equal("A");
    });

    it("should delete specific tasks", async () => {
        await TodoCore.addTask("Task 1", "A", undefined, undefined, "TEST-1");
        await TodoCore.addTask("Task 2", "B", undefined, undefined, "TEST-2");

        await TodoCore.deleteTasks(["TEST-1"]);
        const tasks = await TodoCore.listTasks(true);
        expect(tasks).to.have.lengthOf(1);
        expect(tasks[0].id).to.equal("TEST-2");
    });

    it("should delete all tasks", async () => {
        await TodoCore.addTask("Task 1", "A");
        await TodoCore.addTask("Task 2", "B");

        await TodoCore.deleteAllTasks();
        const tasks = await TodoCore.listTasks(true);
        expect(tasks).to.have.lengthOf(0);

        // ファイルは存在するが空であることを確認
        const exists = await fs.access(tmpFile.path)
            .then(() => true)
            .catch(() => false);
        expect(exists).to.be.true;

        const content = await fs.readFile(tmpFile.path, "utf-8");
        expect(content.trim()).to.equal("");
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
