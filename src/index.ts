#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoCore } from "./todo-core.js";

class TodoServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "todo-server",
                version: "0.1.0",
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        this.setupErrorHandling();
    }

    private setupErrorHandling(): void {
        this.server.onerror = (error) => {
            console.error("[MCP Error]", error);
        };

        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupHandlers(): void {
        this.setupResourceHandlers();
        this.setupToolHandlers();
    }

    private setupResourceHandlers(): void {
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
            resources: [
                {
                    uri: "todo://tasks",
                    name: "Todo Tasks",
                    mimeType: "application/json",
                    description: "List of all todo tasks",
                },
            ],
        }));

        this.server.setRequestHandler(
            ReadResourceRequestSchema,
            async (request) => {
                if (request.params.uri !== "todo://tasks") {
                    throw new McpError(
                        ErrorCode.InvalidRequest,
                        `Unknown resource: ${request.params.uri}`
                    );
                }

                const todos = await TodoCore.listTasks({ showCompleted: true });
                return {
                    contents: [
                        {
                            uri: request.params.uri,
                            mimeType: "application/json",
                            text: JSON.stringify(todos, null, 2),
                        },
                    ],
                };
            }
        );
    }

    private setupToolHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "todo_init",
                    description: "Initialize the todo file",
                    inputSchema: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                },
                {
                    name: "todo_add_task",
                    description: "Add a new todo task",
                    inputSchema: {
                        type: "object",
                        properties: {
                            task: {
                                type: "string",
                                description: "Task description"
                            },
                            priority: {
                                type: "string",
                                description: "Task priority (A-Z)",
                                pattern: "^[A-Z]$"
                            },
                            projects: {
                                type: "array",
                                items: { type: "string" },
                                description: "Projects associated with the task (WITHOUT '+' prefix, e.g. ['Home', 'Work'] not ['+Home', '+Work'])"
                            },
                            contexts: {
                                type: "array",
                                items: { type: "string" },
                                description: "Contexts associated with the task (WITHOUT '@' prefix, e.g. ['phone', 'email'] not ['@phone', '@email'])"
                            },
                            createdDate: {
                                type: "string",
                                description: "Creation date (YYYY-MM-DD)",
                                pattern: "^\\d{4}-\\d{2}-\\d{2}$"
                            },
                            id: {
                                type: "string",
                                description: "Unique identifier for the task"
                            }
                        },
                        required: ["task"]
                    }
                },
                {
                    name: "todo_mark_done",
                    description: "Mark tasks as done",
                    inputSchema: {
                        type: "object",
                        properties: {
                            taskIds: {
                                type: "array",
                                items: {
                                    type: "string"
                                },
                                description: "Array of task IDs to mark as done"
                            }
                        },
                        required: ["taskIds"]
                    }
                },
                {
                    name: "todo_list_tasks",
                    description: "List tasks",
                    inputSchema: {
                        type: "object",
                        properties: {
                            showCompleted: {
                                type: "boolean",
                                description: "Whether to include completed tasks",
                                default: false
                            },
                            project: {
                                type: "string",
                                description: "Filter by project"
                            },
                            context: {
                                type: "string",
                                description: "Filter by context"
                            },
                            priority: {
                                type: "string",
                                description: "Filter by priority",
                                pattern: "^[A-Z]$"
                            }
                        }
                    }
                },
                {
                    name: "todo_delete_tasks",
                    description: "Delete specific tasks",
                    inputSchema: {
                        type: "object",
                        properties: {
                            taskIds: {
                                type: "array",
                                items: {
                                    type: "string"
                                },
                                description: "Array of task IDs to delete"
                            }
                        },
                        required: ["taskIds"]
                    }
                },
                {
                    name: "todo_delete_all",
                    description: "Delete all tasks",
                    inputSchema: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case "todo_init":
                    await TodoCore.init();
                    return {
                        content: [{
                            type: "text",
                            text: "Todo file initialized successfully"
                        }]
                    };

                case "todo_add_task": {
                    const { task, priority, projects, contexts, id, createdDate } = request.params.arguments as {
                        task: string;
                        priority?: string;
                        projects?: string[];
                        contexts?: string[];
                        id?: string;
                        createdDate?: string;
                    };
                    
                    if (typeof task !== "string") {
                        throw new McpError(ErrorCode.InvalidParams, "Invalid task argument");
                    }
                    if (priority && !/^[A-Z]$/.test(priority)) {
                        throw new McpError(ErrorCode.InvalidParams, "Priority must be a single uppercase letter A-Z");
                    }
                    if (createdDate && !/^\d{4}-\d{2}-\d{2}$/.test(createdDate)) {
                        throw new McpError(ErrorCode.InvalidParams, "Created date must be in YYYY-MM-DD format");
                    }

                    await TodoCore.addTask(task, priority, projects, contexts, id, createdDate);
                    return {
                        content: [{
                            type: "text",
                            text: "Task added successfully"
                        }]
                    };
                }

                case "todo_mark_done": {
                    const { taskIds } = request.params.arguments as { taskIds: string[] };
                    if (!Array.isArray(taskIds)) {
                        throw new McpError(ErrorCode.InvalidParams, "Invalid taskIds argument");
                    }
                    await TodoCore.markTasksDone(taskIds);
                    return {
                        content: [{
                            type: "text",
                            text: "Tasks marked as done successfully"
                        }]
                    };
                }

                case "todo_list_tasks": {
                    const { showCompleted = false, project, context, priority } = request.params.arguments as {
                        showCompleted?: boolean;
                        project?: string;
                        context?: string;
                        priority?: string;
                    };

                    const tasks = await TodoCore.listTasks({
                        showCompleted,
                        project,
                        context,
                        priority
                    });

                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify(tasks, null, 2)
                        }]
                    };
                }

                case "todo_delete_tasks": {
                    const { taskIds } = request.params.arguments as { taskIds: string[] };
                    if (!Array.isArray(taskIds)) {
                        throw new McpError(ErrorCode.InvalidParams, "Invalid taskIds argument");
                    }
                    await TodoCore.deleteTasks(taskIds);
                    return {
                        content: [{
                            type: "text",
                            text: "Tasks deleted successfully"
                        }]
                    };
                }

                case "todo_delete_all": {
                    await TodoCore.deleteAllTasks();
                    return {
                        content: [{
                            type: "text",
                            text: "All tasks deleted successfully"
                        }]
                    };
                }

                default:
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${request.params.name}`
                    );
            }
        });
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Todo MCP server running on stdio");
    }
}

const server = new TodoServer();
server.run().catch(console.error);