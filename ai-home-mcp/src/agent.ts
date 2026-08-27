import "dotenv/config";

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import ollama from "ollama";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MODEL = "qwen3:4b";

type McpTool = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

type OllamaToolCall = {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
};

function mcpResultToText(result: unknown): string {
  const value = result as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };

  const texts =
    value.content
      ?.filter((item) => item.type === "text" && item.text)
      .map((item) => item.text) ?? [];

  return texts.length > 0 ? texts.join("\n") : JSON.stringify(result);
}

async function connectToMcp(): Promise<Client> {
  const client = new Client({
    name: "ollama-smart-home-client",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: process.platform === "win32" ? "corepack.cmd" : "corepack",
    args: ["yarn", "tsx", "src/index.ts"],
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  });

  await client.connect(transport);

  return client;
}

async function answer(
  client: Client,
  tools: McpTool[],
  userMessage: string,
): Promise<string> {
  const ollamaTools = tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.inputSchema,
    },
  }));

  const messages: Array<Record<string, unknown>> = [
    {
      role: "system",
      content: `
You are a Persian smart-home assistant.

Use the available tools whenever the user asks about the real state of the home
or asks you to control a device.

Never claim that a device was controlled unless the corresponding tool
completed successfully.

Answer the user in Persian.
      `.trim(),
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const response = await ollama.chat({
      model: MODEL,
      messages: messages as never,
      tools: ollamaTools,
      stream: false,
      think: false,
    });

    messages.push(response.message as unknown as Record<string, unknown>);

    const toolCalls =
      (response.message.tool_calls ?? []) as unknown as OllamaToolCall[];

    if (toolCalls.length === 0) {
      return response.message.content || "پاسخی از مدل دریافت نشد.";
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const toolArguments = toolCall.function.arguments ?? {};

      console.log(
        `\n[Tool] ${toolName}`,
        JSON.stringify(toolArguments, null, 2),
      );

      try {
        const result = await client.callTool({
          name: toolName,
          arguments: toolArguments,
        });

        const toolResult = mcpResultToText(result);

        console.log(`[Result] ${toolResult}`);

        messages.push({
          role: "tool",
          tool_name: toolName,
          content: toolResult,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        console.error(`[Tool error] ${message}`);

        messages.push({
          role: "tool",
          tool_name: toolName,
          content: `Tool failed: ${message}`,
        });
      }
    }
  }

  throw new Error("Agent exceeded the maximum number of tool-call iterations.");
}

async function main(): Promise<void> {
  const client = await connectToMcp();
  const toolsResponse = await client.listTools();
  const tools = toolsResponse.tools as McpTool[];

  console.log(
    `MCP connected. Tools: ${tools.map((tool) => tool.name).join(", ")}`,
  );
  console.log("برای خروج بنویس exit.\n");

  const readline = createInterface({ input, output });

  try {
    while (true) {
      const userMessage = (await readline.question("شما: ")).trim();

      if (!userMessage) {
        continue;
      }

      if (["exit", "quit", "خروج"].includes(userMessage.toLowerCase())) {
        break;
      }

      try {
        const response = await answer(client, tools, userMessage);
        console.log(`\nدستیار: ${response}\n`);
      } catch (error) {
        console.error(
          "\nخطا:",
          error instanceof Error ? error.message : String(error),
          "\n",
        );
      }
    }
  } finally {
    readline.close();
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exit(1);
});
