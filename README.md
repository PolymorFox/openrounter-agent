# OpenRouter Agent

This is a project meant to implement a simple ai agent utilizing the openai sdk with openrouter

## Requirements
- **Node.js**: You can download it [here](https://nodejs.org/en/download) or simply download it using your distribution's package manager
- **OpenRouter API key**: You can get one [here](https://openrouter.ai/settings/keys)
- **WSL**[Optional]: If you're on windows it is best you run this project inside a linux environment using wsl. You can follow this guide [here](https://learn.microsoft.com/en-us/windows/wsl/install)

## Quickstart

```bash
# Clone the repo
git clone https://github.com/PolymorFox/openrounter-agent.git

# Enter your openrouter api key
echo "OPENROUTER_KEY=<api_key>" > .env

# Install dependecies
npm install

# Run the agent
node agent.js

```
