#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const TODO_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  "todo.txt"
);

interface Todo {
  text: string;
  date: string;
  id: string;
  completed: boolean;
}

program.version("0.1.0").description("A simple CLI todo app");

program
  .command("init")
  .description("Initialize the todo file")
  .action(async () => {
    try {
      await fs.access(TODO_FILE);
      console.log("Todo file already exists.");
    } catch {
      await fs.writeFile(TODO_FILE, "");
      console.log("Todo file created successfully.");
    }
  });

program
  .command("add <task>")
  .description("Add a new task")
  .action(async (task: string) => {
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
    console.log("Task added successfully.");
  });

program
  .command("done")
  .alias("d")
  .description("Mark tasks as done")
  .action(async () => {
    const content = await fs.readFile(TODO_FILE, "utf-8");
    const todos = content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map(parseTodoLine);
    const uncompletedTodos = todos.filter((todo) => !todo.completed);

    if (uncompletedTodos.length === 0) {
      console.log("No uncompleted tasks.");
      return;
    }

    const { selectedTasks } = await inquirer
      .prompt([
        {
          type: "checkbox",
          name: "selectedTasks",
          message:
            "Select tasks to mark as done. If you want cancel this mode, please press <Ctrl + c> :",
          choices: uncompletedTodos.map((todo) => ({
            name: todo.text,
            value: todo.id,
          })),
        },
      ])
      .catch(() => ({ selectedTasks: [] }));

    if (selectedTasks.length === 0) {
      console.log("No tasks selected.");
      return;
    }

    const updatedTodos = todos.map((todo) => {
      if (selectedTasks.includes(todo.id)) {
        return { ...todo, completed: true };
      }
      return todo;
    });

    await fs.writeFile(TODO_FILE, updatedTodos.map(formatTodoLine).join("\n"));
    console.log("Tasks marked as done.");
  });

program
  .command("list")
  .alias("l")
  .description("List uncompleted tasks")
  .action(async () => {
    const content = await fs.readFile(TODO_FILE, "utf-8");
    const todos = content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map(parseTodoLine);
    const uncompletedTodos = todos.filter((todo) => !todo.completed);
    if (uncompletedTodos.length === 0) {
      console.log("No uncompleted tasks.");
      return;
    }
    uncompletedTodos.forEach((todo) =>
      console.log(`${todo.text} (${todo.date}) [${todo.id}]`)
    );
  });

program
  .command("list-all")
  .alias("la")
  .description("List all tasks")
  .action(async () => {
    const content = await fs.readFile(TODO_FILE, "utf-8");
    const todos = content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map(parseTodoLine);
    todos.forEach((todo) =>
      console.log(
        `${todo.completed ? "✓" : "☐"} ${todo.text} (${todo.date}) [${todo.id}]`
      )
    );
  });

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

program.parse(process.argv);
