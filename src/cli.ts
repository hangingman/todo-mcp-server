#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { TodoCore } from "./todo-core.js";

program.version("0.1.0").description("A simple CLI todo app");

program
  .command("init")
  .description("Initialize the todo file")
  .action(() => TodoCore.init());

program
  .command("add <task>")
  .description("Add a new task")
  .option("-p, --priority <priority>", "Set priority (A-Z)")
  .action(async (task: string, options: { priority?: string }) => {
    await TodoCore.addTask(task, options.priority);
    console.log(chalk.green("Task added successfully."));
  });

program
  .command("done")
  .alias("d")
  .description("Mark tasks as done")
  .action(async () => {
    const todos = await TodoCore.listTasks();
    if (todos.length === 0) {
      console.log(chalk.yellow("No uncompleted tasks."));
      return;
    }

    const { selectedTasks } = await inquirer
      .prompt([
        {
          type: "checkbox",
          name: "selectedTasks",
          message:
            "Select tasks to mark as done. If you want cancel this mode, please press <Ctrl + c> :",
          choices: todos.map((todo) => ({
            name: `${todo.priority ? chalk.yellow(`(${todo.priority}) `) : ""}${
              todo.text
            }`,
            value: todo.id,
          })),
        },
      ])
      .catch(() => ({ selectedTasks: [] }));

    if (selectedTasks.length === 0) {
      console.log(chalk.yellow("No tasks selected."));
      return;
    }

    await TodoCore.markTasksDone(selectedTasks);
    console.log(chalk.green("Tasks marked as done."));
  });

program
  .command("list")
  .alias("l")
  .description("List uncompleted tasks")
  .action(async () => {
    const todos = await TodoCore.listTasks();
    if (todos.length === 0) {
      console.log(chalk.yellow("No uncompleted tasks."));
      return;
    }
    todos.forEach((todo) =>
      console.log(
        `${chalk.red("□")} ${
          todo.priority ? chalk.yellow(`(${todo.priority}) `) : ""
        }${todo.text} ${chalk.gray(`(${todo.createdDate})`)} ${chalk.blue(
          `[${todo.id}]`
        )}`
      )
    );
  });

program
  .command("list-all")
  .alias("la")
  .description("List all tasks")
  .action(async () => {
    const todos = await TodoCore.listTasks(true);
    todos.forEach((todo) =>
      console.log(
        `${todo.completed ? chalk.green("✓") : chalk.red("□")} ${
          todo.priority ? chalk.yellow(`(${todo.priority}) `) : ""
        }${todo.text} ${chalk.gray(`(${todo.createdDate})`)} ${chalk.blue(
          `[${todo.id}]`
        )}`
      )
    );
  });

program
  .command("delete")
  .alias("del")
  .description("Delete tasks")
  .action(async () => {
    const todos = await TodoCore.listTasks(true);
    if (todos.length === 0) {
      console.log(chalk.yellow("No tasks to delete."));
      return;
    }

    const { selectedTasks } = await inquirer
      .prompt([
        {
          type: "checkbox",
          name: "selectedTasks",
          message:
            "Select tasks to delete (cannot be undone). Press <Ctrl + c> to cancel:",
          choices: todos.map((todo) => ({
            name: `${todo.completed ? chalk.green("✓") : chalk.red("□")} ${
              todo.priority ? chalk.yellow(`(${todo.priority}) `) : ""
            }${todo.text}`,
            value: todo.id,
          })),
        },
      ])
      .catch(() => ({ selectedTasks: [] }));

    if (selectedTasks.length === 0) {
      console.log(chalk.yellow("No tasks selected."));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete ${chalk.red(
          selectedTasks.length
        )} task(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Operation cancelled."));
      return;
    }

    await TodoCore.deleteTasks(selectedTasks);
    console.log(chalk.green("Tasks deleted successfully."));
  });

program
  .command("delete-all")
  .alias("da")
  .description("Delete all tasks")
  .action(async () => {
    const todos = await TodoCore.listTasks(true);
    if (todos.length === 0) {
      console.log(chalk.yellow("No tasks to delete."));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.red(
          "Are you sure you want to delete ALL tasks? This cannot be undone!"
        ),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Operation cancelled."));
      return;
    }

    await TodoCore.deleteAllTasks();
    console.log(chalk.green("All tasks deleted successfully."));
  });

program.parse(process.argv);
