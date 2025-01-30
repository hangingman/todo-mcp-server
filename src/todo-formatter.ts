import { Todo } from "./todo-parser.js";
import chalk from "chalk";

export function formatTodoForDisplay(todo: Todo): string {
    const parts: string[] = [];

    // Checkbox（オプションで視覚的な表示を追加）
    const checkbox = todo.completed ? "✓" : "□";
    parts.push(todo.completed ? chalk.green(checkbox) : chalk.gray(checkbox));
    parts.push(" ");

    // 完了タスクの場合は完了日付を表示
    if (todo.completed && todo.completionDate) {
        parts.push(chalk.gray(`${todo.completionDate} `));
    }

    // 優先度
    if (todo.priority) {
        parts.push(chalk.yellow(`(${todo.priority}) `));
    }

    // メインテキスト部分
    parts.push(todo.completed ? chalk.gray(todo.task) : todo.task);

    // 作成日（完了タスクの場合は完了日付の後に表示）
    if (todo.createdDate) {
        parts.push(` ${chalk.gray(todo.createdDate)}`);
    }

    // ID
    if (todo.id) {
        parts.push(` ${chalk.blue(`id:${todo.id}`)}`);
    }

    // プロジェクト
    if (todo.projects && todo.projects.length > 0) {
        const projectPart = todo.projects.map(p => chalk.cyan(`+${p}`)).join(" ");
        parts.push(` ${projectPart}`);
    }

    // コンテキスト
    if (todo.contexts && todo.contexts.length > 0) {
        const contextPart = todo.contexts.map(c => chalk.magenta(`@${c}`)).join(" ");
        parts.push(` ${contextPart}`);
    }

    return parts.join("");
}