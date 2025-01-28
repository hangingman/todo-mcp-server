import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const TODO_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  "todo.txt"
);

export interface Todo {
  text: string;
  date: string;
  id: string;
  completed: boolean;
}

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

  static async addTask(task: string): Promise<void> {
    const todo: Todo = {
      text: task,
      date: new Date().toISOString().split("T")[0],
      id: uuidv4(),
      completed: false,
    };
    const todoString = `- [ ] ${todo.text} ${todo.date} ${todo.id}\n`;
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
      if (ids.includes(todo.id)) {
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
}

function parseTodoLine(line: string): Todo {
  const match = line.match(/- \[([ x])\] (.+) (\d{4}-\d{2}-\d{2}) (.+)/);
  if (match) {
    return {
      completed: match[1] === "x",
      text: match[2],
      date: match[3],
      id: match[4],
    };
  }
  throw new Error(`Invalid todo line: ${line}`);
}

function formatTodoLine(todo: Todo): string {
  return `- [${todo.completed ? "x" : " "}] ${todo.text} ${todo.date} ${
    todo.id
  }`;
}
