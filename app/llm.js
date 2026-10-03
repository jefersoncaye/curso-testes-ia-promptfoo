// Single client in the OpenAI chat completions format.
// Works with Ollama, LM Studio, OpenAI, Gemini and Anthropic (OpenAI-compatible endpoints).
const config = require('./config');

async function chatCompletion(messages) {
  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages,
      temperature: config.llm.temperature,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  // Removes a reasoning block if the model returns one inside the content
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^[\s\S]*<\/think>/, '').trim();
}

module.exports = { chatCompletion };
