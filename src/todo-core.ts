import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parse, Todo } from "./todo-parser.js";
import { Logger } from "./logger.js";

const logger = Logger.getInstance();

export interface ListTasksOptions {
    showCompleted?: boolean;
    project?: string;
    context?: string;
    priority?: string;
}

export class TodoCore {
    private static getTodoFilePath(): string {
        return process.env.TODO_FILE || path.join(
            process.env.HOME || process.env.USERPROFILE || "",
            "todo.txt"
        );
    }

    static setVerbose(verbose: boolean): void {
        // process.env.DEBUG が 'true' の場合は verbose を true に設定
        const isDebugMode = process.env.DEBUG?.toLowerCase() === 'true';
        logger.setVerbose(isDebugMode || verbose);
    }

    static async init(): Promise<void> {
        try {
            await fs.access(this.getTodoFilePath());
            logger.info("Todo file already exists.");
        } catch {
            await fs.writeFile(this.getTodoFilePath(), "");
            logger.info("Todo file created successfully.");
        }
    }

    static async clearFile(): Promise<void> {
        await fs.writeFile(this.getTodoFilePath(), "");
        logger.debug("Todo file cleared successfully.");
    }

    static async addTask(
        task: string,
        priority?: string,
        projects?: string[],
        contexts?: string[],
        id?: string,
        createdDate?: string
    ): Promise<void> {
        logger.debug(`Attempting to add task: ${task}`);
        logger.debug(`Priority: ${priority}, Projects: ${projects}, Contexts: ${contexts}, ID: ${id}, Created: ${createdDate}`);

        // 優先度のバリデーション
        if (priority && !/^[A-Z]$/.test(priority)) {
            throw new Error("Invalid priority");
        }

        // 作成日のバリデーション
        if (createdDate && !/^\d{4}-\d{2}-\d{2}$/.test(createdDate)) {
            throw new Error("Invalid date format. Use YYYY-MM-DD");
        }

        // projectsのバリデーション
        if (projects && projects.some(p => p.startsWith('+') || p.includes(' '))) {
            throw new Error("Projects should not include '+' prefix or whitespace");
        }

        // contextsのバリデーション
        if (contexts && contexts.some(c => c.startsWith('@') || c.includes(' '))) {
            throw new Error("Contexts should not include '@' prefix or whitespace");
        }

        // タスクの読み込みと重複IDのチェック
        const existingTodos = await this.listTasks({});
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

        const todo: Todo = {
            completed: false,
            completionDate: undefined,
            createdDate: createdDate || new Date().toISOString().split("T")[0],
            priority: priority,
            id: id || uuidv4(),
            text: task,
            projects: projects || [],
            contexts: contexts || [],
            task: taskText
        };

        const todoString = formatTodoLine(todo);
        logger.debug(`Formatted todo line: ${todoString}`);

        await fs.ensureFile(this.getTodoFilePath());
        const content = await fs.readFile(this.getTodoFilePath(), "utf-8");
        logger.debug(`Current file content: ${content}`);

        await fs.writeFile(this.getTodoFilePath(), todoString + '\n' + content);
        logger.debug(`File updated successfully`);
    }

    static async markTasksDone(ids: string[]): Promise<void> {
        logger.debug(`Attempting to mark tasks done with IDs: ${ids}`);

        const content = await fs.readFile(this.getTodoFilePath(), "utf-8");
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
                    completionDate: completionDate,
                    priority: undefined  // 完了時に優先度を削除
                };
                logger.debug("Updated todo before format:", updatedTodo);
                return updatedTodo;
            }
            return todo;
        });

        const updatedContent = updatedTodos.map(formatTodoLine).join("\n");
        logger.debug(`Updated file content: ${updatedContent}`);

        await fs.writeFile(this.getTodoFilePath(), updatedContent);
        logger.debug(`File updated successfully`);
    }

    static async listTasks(options: ListTasksOptions): Promise<Todo[]> {
        logger.debug(`listTasks called with options:`, options);
        const content = await fs.readFile(this.getTodoFilePath(), "utf-8");
        logger.debug(`File content:\n${content}`);

        const todos = content
            .split("\n")
            .filter((line) => line.trim() !== "");
        logger.debug(`Filtered lines: ${todos.length}`);

        const parsedTodos = todos.map(line => {
            logger.debug(`Parsing line: ${line}`);
            try {
                const todo = parseTodoLine(line);
                logger.debug(`Parsed todo:`, todo);
                return todo;
            } catch (error) {
                logger.debug(`Error parsing line:`, error);
                throw error;
            }
        });

        // フィルタリング
        return parsedTodos.filter(todo => {
            if (!options.showCompleted && todo.completed) return false;
            if (options.project && !todo.projects.includes(options.project)) return false;
            if (options.context && !todo.contexts.includes(options.context)) return false;
            if (options.priority && todo.priority !== options.priority) return false;
            return true;
        });
    }

    static async deleteTasks(ids: string[]): Promise<void> {
        logger.debug(`Attempting to delete tasks with IDs: ${ids}`);

        const content = await fs.readFile(this.getTodoFilePath(), "utf-8");
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
            this.getTodoFilePath(),
            remainingTodos.map(formatTodoLine).join("\n")
        );
        logger.debug("Tasks deleted successfully");
    }

    static async deleteAllTasks(): Promise<void> {
        await fs.writeFile(this.getTodoFilePath(), "");
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
    logger.debug("Formatting todo:", todo);

    const priorityPart = todo.completed ? "" : (todo.priority ? `(${todo.priority}) ` : "");  // 完了タスクの場合は優先度を表示しない
    const completedPart = todo.completed ? "x " : "";
    const completionDatePart = todo.completed && todo.completionDate ? `${todo.completionDate} ` : "";
    const taskPart = todo.task;
    const datePart = todo.createdDate ? `${todo.createdDate} ` : "";
    const idPart = `id:${todo.id}`;
    const projectPart = todo.projects.length > 0 ? ` ${todo.projects.map(p => `+${p}`).join(" ")}` : "";
    const contextPart = todo.contexts.length > 0 ? ` ${todo.contexts.map(c => `@${c}`).join(" ")}` : "";

    const formatted = todo.completed
        ? `x ${completionDatePart}${priorityPart}${taskPart} ${datePart}${idPart}${projectPart}${contextPart}`.trim()
        : `${priorityPart}${taskPart} ${datePart}${idPart}${projectPart}${contextPart}`.trim();

    logger.debug("Formatted line:", formatted);
    return formatted;
}