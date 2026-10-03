const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const config = require('./config');
const { chat, classify } = require('./assistant');

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('JSON inválido no corpo da requisição'));
      }
    });
    req.on('error', reject);
  });
}

const CHAT_PAGE = path.join(__dirname, 'public', 'index.html');

async function handle(req, res) {
  // Chat page for manual exploration in the browser
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    return send(res, 200, fs.readFileSync(CHAT_PAGE, 'utf8'), 'text/html; charset=utf-8');
  }

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, {
      status: 'ok',
      mode: config.mode,
      version: config.version,
      model: config.mode === 'llm' ? config.llm.model : 'simulated',
    });
  }

  if (req.method === 'POST' && (req.url === '/chat' || req.url === '/classify')) {
    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      return send(res, 400, { error: error.message });
    }
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return send(res, 400, { error: 'O campo "message" é obrigatório' });
    }

    try {
      if (req.url === '/chat') return send(res, 200, await chat(body));
      return send(res, 200, await classify(body), 'text/plain; charset=utf-8');
    } catch (error) {
      return send(res, 502, { error: `Falha ao chamar a IA: ${error.message}` });
    }
  }

  return send(res, 404, { error: 'Rota não encontrada' });
}

const server = http.createServer((req, res) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  handle(req, res).catch((error) => send(res, 500, { error: error.message }));
});

server.listen(config.port, () => {
  const model = config.mode === 'llm' ? ` | modelo ${config.llm.model} em ${config.llm.baseUrl}` : '';
  console.log(`ShopDemo Assistente rodando em http://localhost:${config.port} (abra no navegador para conversar)`);
  console.log(`Modo ${config.mode} | versão ${config.version}${model}`);
});
