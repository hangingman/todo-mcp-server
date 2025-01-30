import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parse, Todo } from "./todo-parser.js";
import { Logger } from "./logger.js";

const TODO_FILE = process.env.TODO_FILE || path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    "todo.txt"
);

const logger = Logger.getInstance();

export class TodoCore {
    static setVerbose(verbose: boolean): void {
        logger.setVerbose(verbose);
    }

    static async init(): Promise<void> {
        try {
            await fs.access(TODO_FILE);
            logger.info("Todo file already exists.");
        } catch {
            await fs.writeFile(TODO_FILE, "");
            logger.info("Todo file created successfully.");
        }
    }

    static async clearFile(): Promise<void> {
        await fs.writeFile(TODO_FILE, "");
        logger.debug("Todo file cleared successfully.");
    }

    static async addTask(
        task: string,
        priority?: string,
        project?: string,
        context?: string,
        id?: string
    ): Promise<void> {
        logger.debug(`Attempting to add task: ${task}`);
        logger.debug(`Priority: ${priority}, Project: ${project}, Context: ${context}, ID: ${id}`);

        // 優先度のバリデーション
        if (priority && !/^[A-Z]$/.test(priority)) {
            throw new Error("Invalid priority");
        }

        // タスクの読み込みと重複IDのチェック
        const existingTodos = await this.listTasks(true);
        const existingIds = existingTodos.map(t => t.id);
        if (id && existingIds.includes(id)) {
            throw new Error("Duplicate task ID");
        }

        // タスクの生テキストから純粋なタスク部分を抽出
        const taskText = task
            .replace(/\+\S+/g, '')           // プロジェクトタグを除去
            .replace(/@\S+/g, '')            // コンテキストタグを除去
            .replace(/id:[A-Za-z0-9-]+/g, '') // IDを除去
            .replace(/\s+/g, ' ')            // 余分な空白を1つにまとめる
            .trim();

        const createdDate = new Date().toISOString().split("T")[0];

        const todo: Todo = {
            completed: false,
            completionDate: undefined,
            createdDate: createdDate,
            priority: priority,
            id: id || uuidv4(),
            text: task,
            projects: project ? [project] : [],
            contexts: context ? [context] : [],
            task: taskText
        };

        const todoString = formatTodoLine(todo);
        logger.debug(`Formatted todo line: ${todoString}`);

        await fs.ensureFile(TODO_FILE);
        const content = await fs.readFile(TODO_FILE, "utf-8");
        logger.debug(`Current file content: ${content}`);

        await fs.writeFile(TODO_FILE, todoString + '\n' + content);
        logger.debug(`File updated successfully`);
    }

    static async markTasksDone(ids: string[]): Promise<void> {
        logger.debug(`Attempting to mark tasks done with IDs: ${ids}`);

        const content = await fs.readFile(TODO_FILE, "utf-8");
        logger.debug(`Current file content: ${content}`);

        const todos = content
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map(parseTodoLine);

        logger.debug("Parsed todos:", todos);

        // 指定されたIDのタスクが存在するかチェック
        const nonExistentIds = ids.filter(id => !todos.some(todo => todo.id === id));
        if (nonExistentIds.length > 0) {
            throw new Error(`Task not found: ${nonExistentIds.join(", ")}`);
        }

        const completionDate = new Date().toISOString().split("T")[0];
        logger.debug(`Completion date: ${completionDate}`);

        const updatedTodos = todos.map((todo) => {
            if (ids.includes(todo.id ?? "")) {
                const updatedTodo = { 
                    ...todo, 
                    completed: true,
                    completionDate: completionDate
                };
                logger.debug("Updated todo:", updatedTodo);
                return updatedTodo;
            }
            return todo;
        });

        const updatedContent = updatedTodos.map(formatTodoLine).join("\n");
        logger.debug(`Updated file content: ${updatedContent}`);

        await fs.writeFile(TODO_FILE, updatedContent);
        logger.debug(`File updated successfully`);
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
        logger.debug(`Attempting to delete tasks with IDs: ${ids}`);

        const content = await fs.readFile(TODO_FILE, "utf-8");
        const todos = content
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map(parseTodoLine);

        // 指定されたIDのタスクが存在するかチェック
        const nonExistentIds = ids.filter(id => !todos.some(todo => todo.id === id));
        if (nonExistentIds.length > 0) {
            throw new Error(`Task not found: ${nonExistentIds.join(", ")}`);
        }

        const remainingTodos = todos.filter((todo) => !ids.includes(todo.id ?? ""));
        await fs.writeFile(
            TODO_FILE,
            remainingTodos.map(formatTodoLine).join("\n")
        );
        logger.debug("Tasks deleted successfully");
    }

    static async deleteAllTasks(): Promise<void> {
        await fs.writeFile(TODO_FILE, "");
        logger.debug("All tasks deleted");
    }
}

function parseTodoLine(line: string): Todo {
    try {
        const parsed = parse(line);
        return (
            parsed?.ast?.value ??
            (() => {
                throw new Error(`Invalid todo line: ${line}`);
            })()
        );
    } catch (e) {
        throw new Error(`Invalid todo line: ${line}`);
    }
}

function formatTodoLine(todo: Todo): string {
    const priorityPart = todo.priority ? `(${todo.priority}) ` : "";
    const completedPart = todo.completed ? "x " : "";
    const completionDatePart = todo.completed && todo.completionDate ? `${todo.completionDate} ` : "";
    const taskPart = todo.task;
    const datePart = todo.createdDate ? `${todo.createdDate} ` : "";
    const idPart = `id:${todo.id}`;
    const projectPart = todo.projects.length > 0 ? ` ${todo.projects.map(p => `+${p}`).join(" ")}` : "";
    const contextPart = todo.contexts.length > 0 ? ` ${todo.contexts.map(c => `@${c}`).join(" ")}` : "";

    return todo.completed 
        ? `x ${completionDatePart}${priorityPart}${taskPart} ${datePart}${idPart}${projectPart}${contextPart}`.trim()
        : `${priorityPart}${taskPart} ${datePart}${idPart}${projectPart}${contextPart}`.trim();
}