# Testes de IA com promptfoo: do Zero ao Pipeline

Repositório do curso da CodeUp. Contém o ShopDemo Assistente (sistema sob teste) e a suíte de testes com promptfoo.

## ShopDemo Assistente

Chatbot de suporte da loja fictícia ShopDemo, com bugs plantados de propósito na versão `v1` e corrigidos na `v2`.

```bash
cd app
npm install
copy .env.example .env      # Windows (cp no Mac/Linux)
npm start
```

| Variável | Valores | Padrão |
|---|---|---|
| `MODE` | `simulated` (respostas fixas, sem IA) ou `llm` | `simulated` |
| `VERSION` | `v1` (com bugs) ou `v2` (corrigida) | `v1` |
| `LLM_BASE_URL` | URL compatível com a API da OpenAI | `http://localhost:11434/v1` (Ollama) |
| `LLM_MODEL` | Nome do modelo | `qwen3:4b-instruct-2507-q4_K_M` |
| `LLM_API_KEY` | Chave da API (qualquer texto no Ollama) | `ollama` |

Endpoints: `GET /health`, `POST /chat` e `POST /classify`.

## Testes com promptfoo

```bash
cd tests
npm install
npm run test:deterministic     # sem IA, roda contra o modo simulado
npm run test:classifier        # contrato do /classify
npm test                       # suíte inteira (casos "judge" precisam do Ollama com qwen3:8b)
npm run report                 # interface web com os resultados
```

| Pasta ou arquivo | Conteúdo |
|---|---|
| `promptfooconfig.yaml` | Suíte principal contra o `/chat` |
| `classifier.yaml` | Contrato JSON do `/classify` |
| `targets/assistant.yaml` | Provider HTTP do assistente |
| `cases/` | Casos de teste em YAML e CSV |
| `asserts/rules.js` | Regras de negócio em JavaScript |
| `redteam/` | Configuração do red team |
| `compare-models.yaml` e `smoke.yaml` | Comparação de modelos e teste de fumaça dos providers |

Cada caso tem `metadata.type`: `deterministic` (não usa IA, roda no CI em modo simulado) ou `judge` (precisa de uma IA como juiz).

## Modelos usados na gravação

| Tag | ID |
|---|---|
| `qwen3:1.7b` | `8f68893c685c` |
| `qwen3:4b-instruct-2507-q4_K_M` | `0edcdef34593` |
| `qwen3:8b` | `500a1f067a9f` |
