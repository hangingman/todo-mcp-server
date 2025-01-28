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

                const todos = await TodoCore.listTasks(true);
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
                    name: "add_task",
                    description: "Add a new todo task",
                    inputSchema: {
                        type: "object",
                        properties: {
                            task: {
                                type: "string",
                                description: "Task description",
                            },
                        },
                        required: ["task"],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== "add_task") {
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${request.params.name}`
                );
            }

            const { task } = request.params.arguments as { task: string };
            if (typeof task !== "string") {
                throw new McpError(ErrorCode.InvalidParams, "Invalid task argument");
            }

            await TodoCore.addTask(task);
            return {
                content: [
                    {
                        type: "text",
                        text: "Task added successfully",
                    },
                ],
            };
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
