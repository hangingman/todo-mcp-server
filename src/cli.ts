#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { TodoCore } from "./todo-core.js";
import { formatTodoForDisplay } from "./todo-formatter.js";

program
    .version("0.1.0")
    .description("A simple CLI todo app")
    .option("-v, --verbose", "Enable verbose logging")
    .hook('preAction', (thisCommand) => {
        const opts = thisCommand.opts();
        TodoCore.setVerbose(opts.verbose || false);
    });

program
    .command("init")
    .description("Initialize the todo file")
    .action(() => TodoCore.init());

program
    .command("add <task>")
    .description("Add a new task")
    .option("-p, --priority <priority>", "Set priority (A-Z)")
    .option("--project <projects...>", "Add projects")
    .option("--context <contexts...>", "Add contexts")
    .option("--created <date>", "Set creation date (YYYY-MM-DD)")
    .option("--id <id>", "Set task ID")
    .action(async (task: string, options: { 
        priority?: string, 
        project?: string[], 
        context?: string[], 
        created?: string,
        id?: string 
    }) => {
        await TodoCore.addTask(
            task, 
            options.priority, 
            options.project, 
            options.context, 
            options.id,
            options.created
        );
        console.log(chalk.green("Task added successfully."));
    });

program
    .command("done")
    .alias("d")
    .description("Mark tasks as done")
    .action(async () => {
        const todos = await TodoCore.listTasks({});
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
                        name: `${todo.priority ? chalk.yellow(`(${todo.priority}) `) : ""}${todo.text}`,
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
    .option("--project <project>", "Filter by project")
    .option("--context <context>", "Filter by context")
    .option("--priority <priority>", "Filter by priority (A-Z)")
    .action(async (options: { 
        project?: string, 
        context?: string, 
        priority?: string 
    }) => {
        const todos = await TodoCore.listTasks({
            showCompleted: false,
            project: options.project,
            context: options.context,
            priority: options.priority
        });
        if (todos.length === 0) {
            console.log(chalk.yellow("No matching tasks found."));
            return;
        }
        todos.forEach((todo) => {
            console.log(formatTodoForDisplay(todo));
        });
    });

program
    .command("list-all")
    .alias("la")
    .description("List all tasks")
    .option("--project <project>", "Filter by project")
    .option("--context <context>", "Filter by priority (A-Z)")
    .action(async (options: {
        project?: string,
        context?: string,
        priority?: string
    }) => {
        const todos = await TodoCore.listTasks({
            showCompleted: true,
            project: options.project,
            context: options.context,
            priority: options.priority
        });
        if (todos.length === 0) {
            console.log(chalk.yellow("No matching tasks found."));
            return;
        }
        todos.forEach((todo) => {
            console.log(formatTodoForDisplay(todo));
        });
    });

program
    .command("delete")
    .alias("del")
    .description("Delete tasks")
    .action(async () => {
        const todos = await TodoCore.listTasks({ showCompleted: true });
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
                        name: `${todo.completed ? chalk.green("✓") : chalk.red("□")} ${todo.priority ? chalk.yellow(`(${todo.priority}) `) : ""}${todo.task}`,
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
        const todos = await TodoCore.listTasks({ showCompleted: true });
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