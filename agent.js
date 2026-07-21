import dotenv from 'dotenv';
import OpenAI from 'openai';
import PromptSync from 'prompt-sync';
import z from 'zod';

const prompt = PromptSync();

const HelloToolSchema = z.object({});

const tools = [{
  type: "function",
  function: {
    name: "sayHello",
    description: "Prints a hello message to the screen",
    parameters: z.toJSONSchema(HelloToolSchema)
  }
}]

// Load openrouter api from .env file
dotenv.config();

const api_key = process.env.OPENROUTER_KEY;

// The openAI api has perfect compatiblity with the openrouter api
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: api_key
});

const messages = [];
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
    tools: tools
  });

  const AgentReponse = completion.choices[0].message;

  messages.push(AgentReponse);

  if (AgentReponse.tool_calls) {
    for (const toolCall of AgentReponse.tool_calls) {
      switch (toolCall.function.name) {
        case "sayHello":
          const toolResult = "Hello World";
          console.log(toolResult + "\n");

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
          break;
      }

      const finalResponse = await openai.chat.completions.create({
        model: "cohere/north-mini-code:free",
        messages: messages
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
