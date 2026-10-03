// Request pipeline shared by both modes:
// knowledge search (RAG) -> order tool -> answer (simulated or LLM) -> session history.
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');
const rag = require('./rag');
const { getOrderStatus } = require('./tools');
const { getSession, addTurn } = require('./sessions');
const { detectIntent, classifyIntent } = require('./intents');
const { findOrderId } = require('./text');
const simulated = require('./simulated');
const { chatCompletion } = require('./llm');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function systemPrompt(version) {
  return fs.readFileSync(path.join(__dirname, 'prompts', `system-${version}.md`), 'utf8').trim();
}

function orderContext(order) {
  if (!order.found) return `Pedido ${order.orderId}: não encontrado na conta do cliente.`;
  return `Pedido ${order.id}: cliente ${order.customerName}, endereço ${order.address}, itens ${order.items.join(', ')}, status ${order.status}, previsão de entrega ${order.estimatedDelivery}.`;
}

async function chat({ message, sessionId }) {
  const { version, mode } = config;
  const session = getSession(sessionId);
  const intent = detectIntent(message);

  const context = rag.search(message, version);
  const tools = [];

  // Order tool. v2 remembers the order from earlier turns; v1 ignores the history (bug B6).
  let orderId = findOrderId(message);
  if (!orderId && version === 'v2' && intent === 'order') orderId = session.lastOrderId;
  let order = null;
  if (orderId) {
    order = getOrderStatus(orderId, config.customerId, version);
    tools.push({ name: 'getOrderStatus', args: { orderId }, result: order });
    context.push(orderContext(order));
    if (order.found) session.lastOrderId = orderId;
  }

  // Slow path on return questions in v1 (bug B8)
  if (version === 'v1' && intent === 'return') await sleep(4000);

  let reply;
  if (mode === 'simulated') {
    reply = simulated.reply(message, { version, intent, order, orderId });
  } else {
    const header = version === 'v1' ? 'Store information:' : 'Informações da loja:';
    const info = context.length ? context.map((c) => `- ${c}`).join('\n') : '- (nenhuma informação encontrada)';
    const messages = [
      { role: 'system', content: `${systemPrompt(version)}\n\n${header}\n${info}` },
      ...(version === 'v2' ? session.history : []),
      { role: 'user', content: message },
    ];
    reply = await chatCompletion(messages);
  }

  addTurn(session, message, reply);
  return {
    reply,
    context,
    tools,
    sessionId: session.id,
    model: mode === 'llm' ? config.llm.model : 'simulated',
  };
}

const CLASSIFY_PROMPT = {
  v1: `Classify the customer message into one of these intents: order_status, return, shipping, product, other.
Return a JSON with the fields intent, orderId and confidence.`,
  v2: `Classifique a mensagem do cliente em uma destas intenções: order_status, return, shipping, product, other.
Responda SOMENTE com um objeto JSON puro, sem markdown, sem bloco de código e sem texto antes ou depois.
Formato: {"intent": "<intenção>", "orderId": "<somente dígitos, como texto>" ou null, "confidence": <número de 0 a 1>}`,
};

// Fix applied in v2 (LLM05, improper output handling): extract and normalize the JSON before returning it
function sanitizeClassification(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return raw;
  try {
    const data = JSON.parse(match[0]);
    return JSON.stringify({
      intent: data.intent,
      orderId: data.orderId === null || data.orderId === undefined ? null : String(data.orderId),
      confidence: Number(data.confidence),
    });
  } catch {
    return raw;
  }
}

// Returns the raw text that another system will parse with JSON.parse
async function classify({ message }) {
  const { version, mode } = config;

  if (mode === 'simulated') {
    const intent = classifyIntent(message);
    const orderId = findOrderId(message);
    const confidence = intent === 'other' ? 0.55 : 0.93;
    if (version === 'v1') {
      // bug B5: JSON inside a markdown block and orderId as a number
      const body = JSON.stringify({ intent, orderId: orderId ? Number(orderId) : null, confidence }, null, 2);
      return '```json\n' + body + '\n```';
    }
    return JSON.stringify({ intent, orderId, confidence });
  }

  const raw = await chatCompletion([
    { role: 'system', content: CLASSIFY_PROMPT[version] },
    { role: 'user', content: message },
  ]);
  return version === 'v2' ? sanitizeClassification(raw) : raw;
}

module.exports = { chat, classify };
