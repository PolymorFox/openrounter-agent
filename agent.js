import dotenv from "dotenv";
import OpenAI from "openai";
import PromptSync from "prompt-sync";
import os from "node:os"
import { HelloTool, executeCommandTool } from "./tools.js"

const prompt = PromptSync();

const tools = [
  {
    type: "function",
    function: {
      name: HelloTool.name,
      description: HelloTool.description,
      parameters: HelloTool.schema,
    },
  },

  {
    type: "function",
    function: {
      name: executeCommandTool.name,
      description: executeCommandTool.description,
      parameters: executeCommandTool.schema,
    },
  },
];

// Load openrouter api from .env file
dotenv.config();

const api_key = process.env.OPENROUTER_KEY;
// Use cohere as the default model it is free and should work for everyone
const model_id = process.env.MODEL_ID ? process.env.MODEL_ID : "cohere/north-mini-code:free";
if (!api_key) {
  console.error("OPENROUTER_KEY is not defined exiting immediately");
  process.exit(1);
}

// The openAI api has perfect compatiblity with the openrouter api
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: api_key,
});

const messages = [];

// Setup initial agent using user's system info
messages.push({
  "role": "system",
  "content": `User OS: ${os.platform()} OS Release: ${os.release()} OS Version ${os.version()} OS Arch ${os.arch()}`,
});
async function PromptAgent() {
  const query = prompt("> ");
  if (query === "exit") {
    process.exit(0);
  } else if (query === "clear") {
    console.clear();
    messages.push({
      role: "user",
      content: query,
    });
    return;
  }

  messages.push({
    role: "user",
    content: query,
  });

  const completion = await openai.chat.completions.create({
    model: model_id,
    messages: messages,
    tools: tools,
  });

  const AgentReponse = completion.choices[0].message;

  messages.push(AgentReponse);

  if (AgentReponse.tool_calls) {
    for (const toolCall of AgentReponse.tool_calls) {
      switch (toolCall.function.name) {
        case "sayHello":
          console.log(`Executing tool ${toolCall.function.name}`);
          const toolResult = HelloTool.tool();
          console.log(toolResult + "\n");

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
          break;
        case "executeCommand":
          const commandArgs = JSON.parse(toolCall.function.arguments);
          console.log(`Executing tool executeCommand with command ${commandArgs.command}`);
          const commandResult = await executeCommandTool.tool(command);
          console.log(commandResult);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: String(commandResult),
          });
          break;
      }

      const finalResponse = await openai.chat.completions.create({
        model: "cohere/north-mini-code:free",
        messages: messages,
      });

      const finalMessage = finalResponse.choices[0];
      console.log(finalMessage.message.content);
      messages.push(finalMessage);
    }
  } else {
    console.log(AgentReponse.content);
  }
}

(async () => {
  while (true) {
    await PromptAgent();
  }
})();
