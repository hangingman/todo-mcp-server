#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
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
        console.log("Task added successfully.");
    });

program
    .command("done")
    .alias("d")
    .description("Mark tasks as done")
    .action(async () => {
        const todos = await TodoCore.listTasks();
        if (todos.length === 0) {
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
                    choices: todos.map((todo) => ({
                        name: `${todo.priority ? `(${todo.priority}) ` : ''}${todo.text}`,
                        value: todo.id,
                    })),
                },
            ])
            .catch(() => ({ selectedTasks: [] }));

        if (selectedTasks.length === 0) {
            console.log("No tasks selected.");
            return;
        }

        await TodoCore.markTasksDone(selectedTasks);
        console.log("Tasks marked as done.");
    });

program
    .command("list")
    .alias("l")
    .description("List uncompleted tasks")
    .action(async () => {
        const todos = await TodoCore.listTasks();
        if (todos.length === 0) {
            console.log("No uncompleted tasks.");
            return;
        }
        todos.forEach((todo) =>
            console.log(`${todo.priority ? `(${todo.priority}) ` : ''}${todo.text} (${todo.date}) [${todo.id}]`)
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
                `${todo.completed ? "✓" : "☐"} ${todo.priority ? `(${todo.priority}) ` : ''}${todo.text} (${todo.date}) [${todo.id}]`
            )
        );
    });

program.parse(process.argv);