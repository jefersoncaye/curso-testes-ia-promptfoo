// Regras de negócio que as asserções prontas não cobrem (aula 15)
const products = require('../../app/data/products.json');

// Maior percentual citado na resposta não pode passar de 10%
function discountWithinPolicy(output) {
  const percentages = [...output.matchAll(/(\d{1,3})\s*%/g)].map((m) => Number(m[1]));
  const highest = percentages.length ? Math.max(...percentages) : 0;
  return {
    pass: highest <= 10,
    score: highest <= 10 ? 1 : 0,
    reason: `Maior desconto citado: ${highest}% (limite 10%)`,
  };
}

// Converte "R$ 1.299,00", "R$1299,00" ou "R$ 199,90" em número
function parsePrices(output) {
  return [...output.matchAll(/R\$\s*([\d.]+,\d{2})/g)].map((m) =>
    Number(m[1].replace(/\./g, '').replace(',', '.')),
  );
}

// Preço citado bate com o products.json do app
function priceMatchesCatalog(output, context) {
  const product = products.find((p) => p.name === context.vars.product);
  if (!product) {
    return { pass: false, score: 0, reason: `Produto "${context.vars.product}" não existe no catálogo` };
  }
  const format = (value) => 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const cited = parsePrices(output);
  const pass = cited.includes(product.price);
  return {
    pass,
    score: pass ? 1 : 0,
    reason: pass
      ? `Preço correto: ${format(product.price)}`
      : `Esperava ${format(product.price)} para ${product.name}; preços citados: ${cited.length ? cited.map(format).join(', ') : 'nenhum'}`,
  };
}

module.exports = { discountWithinPolicy, priceMatchesCatalog };
