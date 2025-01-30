import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parse, Todo } from "./todo-parser.js";

const TODO_FILE = path.join(
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

  static async addTask(task: string, priority?: string, project?: string, context?: string, id?: string): Promise<void> {
    if (priority && !/^[A-Z]$/.test(priority)) {
      throw new Error("Priority must be a single uppercase letter A-Z");
    }

    const todo: Todo = {
      completed: false,
      completionDate: undefined,
      createdDate: new Date().toISOString().split("T")[0],
      priority: priority,
      id: id || uuidv4(),
      text: task,
      projects: project ? [project] : [],
      contexts: context ? [context] : [],
    };
    const todoString = `- [ ] ${todo.priority ? `(${todo.priority}) ` : ""}${
      todo.text
    } ${todo.createdDate} ${todo.id} ${todo.projects.map(p => `+${p}`).join(' ')} ${todo.contexts.map(c => `@${c}`).join(' ')}\n`;
    await fs.ensureFile(TODO_FILE);
    const content = await fs.readFile(TODO_FILE, "utf-8");
    await fs.writeFile(TODO_FILE, todoString + content);
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
  return `- [${todo.completed ? "x" : " "}] ${
    todo.priority ? `(${todo.priority}) ` : ""
  }${todo.text} ${todo.createdDate} ${todo.id}`;
}
