# Prompts de avaliação (juiz)

Prompts próprios para as asserções de RAG, usados em `cases/05-rag.yaml` com `rubricPrompt: file://...`.

| Arquivo | Asserção | Por que existe |
|---|---|---|
| `context-relevance.txt` | `context-relevance` | Com o prompt padrão, o juiz reescreve as frases do contexto e o promptfoo reprova com "Grader output does not quote the provided context" |
| `faithfulness-statements.txt` | `context-faithfulness` (etapa 1) | Com o prompt padrão, o juiz repete a linha "statements:", que o promptfoo conta como uma afirmação sem veredito |
| `faithfulness-verdicts.txt` | `context-faithfulness` (etapa 2) | Mesmo formato do padrão, com exemplo menor |

As variáveis entre `{{ }}` são preenchidas pelo promptfoo: `query` e `context` na relevância; `question`, `answer`, `context` e `statements` na fidelidade.
