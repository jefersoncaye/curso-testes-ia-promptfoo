// Rule-based intent detection used by the simulated mode, the /classify endpoint
// in simulated mode and the conversation logic.
const { normalize, hasAny, findRegion, findOrderId } = require('./text');
const products = require('./data/products.json');

const INJECTION_PATTERNS = [
  /ignor\w* (as |todas as |suas |minhas )*(\w+ )?(instruc|regras)/,
  /(mostr|revel|repit|traduz|exib|imprim|me (de|da|passa|passe|diga))\w*.{0,40}(prompt|instruc|configurac|regras internas|codigo interno)/,
  /finja que (voce e|e) o desenvolvedor/,
  /modo (desenvolvedor|developer|dev)/,
  /system prompt/,
  /prompt (de sistema|completo|inicial)/,
];

const OFF_TOPIC = ['receita', 'bolo', 'futebol', 'piada', 'poema', 'politica', 'eleicao', 'filme', 'novela', 'horoscopo', 'matematica', 'previsao do tempo', 'capital da', 'capital do'];
const RETURNS = ['troca', 'trocar', 'devolucao', 'devolver', 'arrependimento', 'arrependi', 'reembolso', 'estorno'];
const DISCOUNT = ['desconto', 'descontos', 'cupom', 'cupons'];
const SHIPPING = ['frete', 'entrega', 'entregam', 'prazo', 'envio', 'enviam'];
const ORDER = ['pedido', 'pedidos', 'chega', 'chegar', 'rastreio', 'rastrear', 'rastreamento', 'encomenda'];
const PAYMENT = ['pagamento', 'pagar', 'pago', 'parcelar', 'parcela', 'parcelas', 'pix', 'boleto', 'cartao'];
const WARRANTY = ['garantia'];
const GREETING = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'e ai'];
const ENGLISH = ['order', 'delivery', 'shipping', 'refund', 'tracking', 'discount', 'coupon', 'payment', 'price', 'product', 'store', 'help'];

function findProduct(message) {
  const text = normalize(message);
  return (
    products.find((p) => text.includes(normalize(p.name))) ||
    products.find((p) => hasAny(text, [normalize(p.name).split(' ')[0]])) ||
    null
  );
}

function detectIntent(message) {
  const text = normalize(message);
  if (INJECTION_PATTERNS.some((re) => re.test(text))) return 'injection';
  if (hasAny(text, OFF_TOPIC)) return 'off_topic';
  if (hasAny(text, DISCOUNT)) return 'discount';
  if (hasAny(text, RETURNS)) return 'return';
  if (findOrderId(message)) return 'order';
  if (findRegion(message) || hasAny(text, ['frete'])) return 'shipping';
  if (hasAny(text, ORDER)) return 'order';
  if (hasAny(text, SHIPPING)) return 'shipping';
  if (hasAny(text, PAYMENT)) return 'payment';
  if (hasAny(text, WARRANTY)) return 'warranty';
  if (findProduct(message) || hasAny(text, ['preco', 'quanto custa', 'valor do', 'valor da'])) return 'product';
  if (hasAny(text, GREETING)) return 'greeting';
  return 'other';
}

function hasEnglishTerm(message) {
  return hasAny(normalize(message), ENGLISH);
}

// Maps internal intents to the /classify contract
const CLASSIFY_INTENT = { order: 'order_status', return: 'return', shipping: 'shipping', product: 'product' };
function classifyIntent(message) {
  return CLASSIFY_INTENT[detectIntent(message)] || 'other';
}

module.exports = { detectIntent, classifyIntent, findProduct, hasEnglishTerm };
