import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parse, Todo } from "./todo-parser.js";

const TODO_FILE = process.env.TODO_FILE || path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    "todo.txt"
);

export class TodoCore {
    static async init(): Promise<void> {
        try {
            await fs.access(TODO_FILE);
            console.log("Todo file already exists.");
        } catch {
            await fs.writeFile(TODO_FILE, "");
            console.log("Todo file created successfully.");
        }
    }

    static async addTask(
        task: string,
        priority?: string,
        project?: string,
        context?: string,
        id?: string
    ): Promise<void> {
        if (priority && !/^[A-Z]$/.test(priority)) {
            throw new Error("Priority must be a single uppercase letter A-Z");
        }

        // タスクの生テキストから純粋なタスク部分を抽出
        const taskText = task
            .replace(/\+\S+/g, '')           // プロジェクトタグを除去
            .replace(/@\S+/g, '')            // コンテキストタグを除去
            .replace(/id:[A-Za-z0-9-]+/g, '') // IDを除去
            .replace(/\s+/g, ' ')            // 余分な空白を1つにまとめる
            .trim();

        const todo: Todo = {
            completed: false,
            completionDate: undefined,
            createdDate: new Date().toISOString().split("T")[0],
            priority: priority,
            id: id || uuidv4(),
            text: task,
            projects: project ? [project] : [],
            contexts: context ? [context] : [],
            task: taskText
        };
        const todoString = formatTodoLine(todo);
        await fs.ensureFile(TODO_FILE);
        const content = await fs.readFile(TODO_FILE, "utf-8");
        await fs.writeFile(TODO_FILE, todoString + '\n' + content);
    }

    static async markTasksDone(ids: string[]): Promise<void> {
        const content = await fs.readFile(TODO_FILE, "utf-8");
        const todos = content
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map(parseTodoLine);

        const updatedTodos = todos.map((todo) => {
            if (ids.includes(todo.id ?? "")) {
                return { ...todo, completed: true };
            }
            return todo;
        });

        await fs.writeFile(TODO_FILE, updatedTodos.map(formatTodoLine).join("\n"));
    }

    static async listTasks(showCompleted = false): Promise<Todo[]> {
        const content = await fs.readFile(TODO_FILE, "utf-8");
        const todos = content
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map(parseTodoLine);

        return showCompleted ? todos : todos.filter((todo) => !todo.completed);
    }

    static async deleteTasks(ids: string[]): Promise<void> {
        const content = await fs.readFile(TODO_FILE, "utf-8");
        const todos = content
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map(parseTodoLine);

        const remainingTodos = todos.filter((todo) => !ids.includes(todo.id ?? ""));
        await fs.writeFile(
            TODO_FILE,
            remainingTodos.map(formatTodoLine).join("\n")
        );
    }

    static async deleteAllTasks(): Promise<void> {
        await fs.writeFile(TODO_FILE, "");
    }
}

function parseTodoLine(line: string): Todo {
    try {
        const parsed = parse(line);
        console.log("Parsing line:", line);
        console.log("Parse result:", JSON.stringify(parsed, null, 2));
        return (
            parsed?.ast?.value ??
            (() => {
                throw new Error(`Invalid todo line: ${line}`);
            })()
        );
    } catch (e) {
        console.error("Parse error:", e);
        throw new Error(`Invalid todo line: ${line}`);
    }
}

function formatTodoLine(todo: Todo): string {
    // 優先度のフォーマットを修正
    const priorityPart = todo.priority ? `(${todo.priority}) ` : "";
    const completedPart = todo.completed ? "x " : "";
    const taskPart = todo.task;
    const datePart = todo.createdDate ? `${todo.createdDate} ` : "";
    const idPart = `id:${todo.id}`;
    const projectPart = todo.projects.length > 0 ? ` ${todo.projects.map(p => `+${p}`).join(" ")}` : "";
    const contextPart = todo.contexts.length > 0 ? ` ${todo.contexts.map(c => `@${c}`).join(" ")}` : "";

    return `${completedPart}${priorityPart}${taskPart} ${datePart}${idPart}${projectPart}${contextPart}`.trim();
}