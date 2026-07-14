import dotenv from 'dotenv';
import OpenAI from 'openai';
import PromptSync from 'prompt-sync';

const prompt = PromptSync();

// Load openrouter api from .env file
dotenv.config();

const api_key = process.env.OPENROUTER_KEY

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
    messages: messages
  });

  console.log(completion.choices[0].message.content);
}

(async () => {
  while (true) {
    await PromptAgent();
  }
})();
