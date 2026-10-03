# Testes de IA com promptfoo: do Zero ao Pipeline

Repositório do curso da CodeUp. Aqui está o **ShopDemo Assistente**, o chatbot que você vai testar durante o curso. A pasta de testes você cria do zero, aula a aula.

## Como este repositório está organizado

| Onde | O que tem |
|---|---|
| Branch `main` | Ponto de partida: só o app. É daqui que você começa |
| Tags `aula-XX` | O estado do projeto no fim de cada aula. Use para conferir o seu código ou continuar de um ponto |
| Branch `final` | A solução completa do curso |

```bash
git clone https://github.com/jefersoncaye/curso-testes-ia-promptfoo.git
git tag                    # lista as aulas disponíveis
git checkout aula-15       # vai para o fim da aula 15
git checkout main          # volta para o seu trabalho
```

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

## Requisitos

- Node.js 24 LTS (mínimo 22.22)
- Git
- Ollama, para os testes com IA local (o modo simulado funciona sem IA nenhuma)

## Modelos usados na gravação

| Tag | ID |
|---|---|
| `qwen3:1.7b` | `8f68893c685c` |
| `qwen3:4b-instruct-2507-q4_K_M` | `0edcdef34593` |
| `qwen3:8b` | `500a1f067a9f` |

Se o `ollama list` mostrar um ID diferente, a tag passou a apontar para outra versão do modelo e as respostas podem mudar em relação ao vídeo.
