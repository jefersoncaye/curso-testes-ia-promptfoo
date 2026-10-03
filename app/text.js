// Text helpers shared by the app

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function hasWord(text, word) {
  return new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`).test(text);
}

function hasAny(text, words) {
  return words.some((word) => hasWord(text, word));
}

function formatPrice(value) {
  return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const REGIONS = [
  { name: 'Norte', terms: ['norte', 'manaus', 'amazonas', 'belem', 'acre', 'rio branco', 'rondonia', 'porto velho', 'roraima', 'boa vista', 'amapa', 'macapa', 'tocantins', 'palmas'] },
  { name: 'Nordeste', terms: ['nordeste', 'salvador', 'bahia', 'recife', 'pernambuco', 'fortaleza', 'ceara', 'natal', 'joao pessoa', 'paraiba', 'maceio', 'alagoas', 'aracaju', 'sergipe', 'sao luis', 'maranhao', 'teresina', 'piaui'] },
  { name: 'Centro-Oeste', terms: ['centro-oeste', 'centro oeste', 'brasilia', 'distrito federal', 'goiania', 'goias', 'cuiaba', 'mato grosso', 'campo grande'] },
  { name: 'Sudeste', terms: ['sudeste', 'sao paulo', 'rio de janeiro', 'belo horizonte', 'minas gerais', 'vitoria', 'espirito santo'] },
  { name: 'Sul', terms: ['sul', 'porto alegre', 'curitiba', 'parana', 'florianopolis', 'santa catarina', 'chapeco', 'joinville'] },
];

// Returns the delivery region mentioned in the message (city, state or region name)
function findRegion(message) {
  const text = normalize(message);
  return REGIONS.find((region) => hasAny(text, region.terms)) || null;
}

function findOrderId(message) {
  const match = String(message || '').match(/(^|\D)(\d{4})(?!\d)/);
  return match ? match[2] : null;
}

module.exports = { normalize, hasWord, hasAny, formatPrice, findRegion, findOrderId };
