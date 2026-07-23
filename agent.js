import dotenv from "dotenv";
import OpenAI from "openai";
import PromptSync from "prompt-sync";
import z from "zod";
import { spawn } from "node:child_process"
import { stdout } from "node:process";
import os from "node:os"

const prompt = PromptSync();

const HelloToolSchema = z.object({});
const ExecuteCommandToolSchema = z.object({
  command: z.string().describe("The command to execute"),
});

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    // Split the command into program and arguments
    const [program, ...args] = command.split(/\s+/);

    const commandInstance = spawn(program, args);
    let output = "";

    commandInstance.stdout.on('data', (data) => {
      output += `stdout: ${data}`;
    });

    commandInstance.stderr.on('data', (data) => {
      output += `stderr: ${data}`;
    });

    commandInstance.on('close', (code) => {
      output += ` Exit Code ${code}`;
      resolve(output);
    });

    commandInstance.on('error', (err) => {
      reject(`Error: ${err.message}`);
    });
  });
}

const tools = [
  {
    type: "function",
    function: {
      name: "sayHello",
      description: "Prints a hello message to the screen",
      parameters: z.toJSONSchema(HelloToolSchema),
    },
  },

  {
    type: "function",
    function: {
      name: "executeCommand",
      description: "Executes a shell command and return the result",
      parameters: z.toJSONSchema(ExecuteCommandToolSchema),
    },
  },
];

// Load openrouter api from .env file
dotenv.config();

const api_key = process.env.OPENROUTER_KEY;

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
    model: "cohere/north-mini-code:free",
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
          const toolResult = "Hello World";
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
          const commandResult = await executeCommand(String(commandArgs.command));
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
