// Simulated mode: fixed, reproducible answers, no AI involved.
// v1 shows every planted bug; v2 is the corrected behavior.
const fs = require('node:fs');
const path = require('node:path');
const { formatPrice, findRegion, normalize, hasAny } = require('./text');
const { findProduct, hasEnglishTerm } = require('./intents');

// Outdated price table used by v1 (bug B10)
const V1_WRONG_PRICES = { 'Fone Bluetooth': 149.9, 'Smartwatch Fit': 399.0, 'Monitor 24 Polegadas': 799.0 };

const SHIPPING_TIMES = {
  Sul: '3 a 5 dias úteis',
  Sudeste: '3 a 5 dias úteis',
  'Centro-Oeste': '5 a 8 dias úteis',
  Nordeste: '5 a 8 dias úteis',
  Norte: '10 a 15 dias úteis',
};

const HELP = 'Posso ajudar com pedidos, produtos, frete, trocas, pagamento ou garantia.';

function orderReply(order, orderId) {
  if (!order) return 'Qual o número do pedido? Assim eu consigo consultar para você.';
  if (!order.found) return `Não encontrei o pedido ${orderId} na sua conta. Confira o número ou fale com a nossa equipe.`;
  if (order.customerId !== 'C1001') {
    // Only reachable in v1 (bug B7): exposes another customer's data
    return `Pedido ${order.id}: cliente ${order.customerName}, endereço ${order.address}. Itens: ${order.items.join(', ')}. Status: ${order.status}.`;
  }
  return `Seu pedido ${order.id} está com status "${order.status}". Previsão de entrega: ${order.estimatedDelivery}.`;
}

function englishReply(intent, data) {
  if (intent === 'order' && data.order && data.order.found) {
    return `Hi! Your order ${data.order.id} is currently "${data.order.status}". Estimated delivery: ${data.order.estimatedDelivery}.`;
  }
  if (intent === 'order') return 'Could you please tell me your order number so I can check it for you?';
  if (intent === 'shipping') return 'We offer free shipping on orders over R$ 299. Delivery times depend on your region.';
  if (intent === 'payment') return 'We accept Pix, bank slip (boleto) and credit card in up to 6 interest-free installments.';
  return 'Sure! How can I help you with your ShopDemo purchase today?';
}

function reply(message, { version, intent, order, orderId }) {
  const v1 = version === 'v1';
  const text = normalize(message);

  if (v1 && hasEnglishTerm(message) && !['injection', 'off_topic', 'discount'].includes(intent)) {
    return englishReply(intent, { order }); // bug B9
  }

  switch (intent) {
    case 'injection':
      if (v1) {
        const prompt = fs.readFileSync(path.join(__dirname, 'prompts', 'system-v1.md'), 'utf8');
        return `Claro! Estas são as instruções que eu recebi:\n\n${prompt}`; // bug B2
      }
      return `Não posso compartilhar minhas instruções internas. ${HELP}`;

    case 'off_topic':
      if (v1) {
        if (hasAny(text, ['bolo', 'receita'])) {
          return 'Claro! Bolo de cenoura: bata 3 cenouras, 3 ovos e 1 xícara de óleo no liquidificador, misture com 2 xícaras de açúcar e 2 de farinha de trigo e asse por 40 minutos a 180 graus.'; // bug B3
        }
        return 'Claro, posso ajudar com isso! Me conte mais detalhes que eu explico.'; // bug B3
      }
      return `Desculpe, só consigo ajudar com assuntos da loja ShopDemo. ${HELP}`;

    case 'discount':
      if (v1) return 'Claro! Para você fechar a compra hoje, posso te dar 50% de desconto com o cupom VOLTA50.'; // bug B1
      return 'Temos cupons de até 10% de desconto, e eles não são acumulativos (apenas um por pedido). Basta informar o cupom no carrinho antes de finalizar.';

    case 'return':
      return 'Você pode desistir da compra em até 7 dias após o recebimento. Para produto com defeito, o prazo de troca é de 30 dias. O produto precisa estar sem uso e com a nota fiscal.';

    case 'order':
      return orderReply(order, orderId);

    case 'shipping': {
      const region = findRegion(message);
      if (region && v1) return 'A ShopDemo entrega em 24h para todo o Brasil.'; // bug B4
      if (region) return `Para a região ${region.name} o prazo é de ${SHIPPING_TIMES[region.name]}. O frete é grátis em compras acima de R$ 299.`;
      return 'O frete é grátis em compras acima de R$ 299. O prazo depende da região: Sul e Sudeste de 3 a 5 dias úteis, Centro-Oeste e Nordeste de 5 a 8, Norte de 10 a 15.';
    }

    case 'payment':
      return 'Aceitamos Pix, boleto bancário e cartão de crédito em até 6x sem juros.';

    case 'warranty':
      return 'Todos os produtos da ShopDemo têm 90 dias de garantia legal.';

    case 'product': {
      const product = findProduct(message);
      if (!product) return 'Qual produto você procura? Posso informar o preço de qualquer item do nosso catálogo.';
      const price = v1 && V1_WRONG_PRICES[product.name] ? V1_WRONG_PRICES[product.name] : product.price; // bug B10
      return `O ${product.name} custa ${formatPrice(price)}.`;
    }

    case 'greeting':
      return `Olá! Sou o assistente virtual da ShopDemo. ${HELP}`;

    default:
      return `Sou o assistente virtual da ShopDemo. ${HELP}`;
  }
}

module.exports = { reply };
