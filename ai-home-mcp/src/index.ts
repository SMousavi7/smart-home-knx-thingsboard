import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getHomeStatus, setLight } from "./thingsboard.js";

const server = new McpServer({
  name: "smart-home-thingsboard",
  version: "1.0.0",
});

server.tool(
  "get_home_status",
  "Read the latest room temperature, light state and blind position from ThingsBoard.",
  {},
  async () => {
    const status = await getHomeStatus();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(status),
        },
      ],
    };
  },
);

server.tool(
  "set_light",
  "Turn the smart-home light on or off through ThingsBoard RPC.",
  {
    state: z.boolean().describe("true turns the light on; false turns it off"),
  },
  async ({ state }) => {
    await setLight(state);

    return {
      content: [
        {
          type: "text",
          text: state
            ? "Light ON command sent successfully."
            : "Light OFF command sent successfully.",
        },
      ],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});