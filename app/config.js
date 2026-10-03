const fs = require('node:fs');
const path = require('node:path');

// Loads app/.env without overriding variables already set in the environment
// (the GitHub Actions workflow relies on this).
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const config = {
  port: Number(process.env.PORT || 3000),
  mode: process.env.MODE === 'llm' ? 'llm' : 'simulated',
  version: process.env.VERSION === 'v2' ? 'v2' : 'v1',
  llm: {
    baseUrl: (process.env.LLM_BASE_URL || 'http://localhost:11434/v1').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL || 'qwen3:4b-instruct-2507-q4_K_M',
    apiKey: process.env.LLM_API_KEY || 'ollama',
    temperature: Number(process.env.LLM_TEMPERATURE || 0),
  },
  // Customer logged in to the chat
  customerId: 'C1001',
};

module.exports = config;
