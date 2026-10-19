# Silksong Guide — Plano de execução com agentes

Complementa o `silksong-estrutura.md`. Define quem faz o quê, quem é dono de quais arquivos e como os trabalhos se encaixam sem conflito.

## 1. Princípio: começar pequeno, ampliar com evidência

Cinco agentes para um site estático de poucos arquivos custam mais em coordenação do que economizam. O plano tem **dois estágios**.

**Estágio 1: fatia vertical (2 agentes + Athos)**
- Orquestrador (Opus 5.5, high)
- Dev (Sonnet 5.5, high)
- Athos: escreve o rascunho dos dados e o módulo `requirements.js`, e revisa tudo.
- Objetivo: uma região, dois itens, cadeia de requisitos, progresso local e login real, de ponta a ponta.

**Estágio 2: ampliação (até 5 papéis)**
Só começa quando a fatia vertical funciona e os contratos foram provados na prática. Aí entram o segundo dev e os agentes de QA.

## 2. Papéis (estágio 2 completo)

| Papel | Modelo | Responsabilidade |
|---|---|---|
| **Orquestrador** | Opus 5.5 (high) | Dono do ambiente. Cria o scaffold, define os contratos, distribui tarefas, integra, resolve conflitos e faz a revisão final. Não escreve funcionalidades. |
| **Dev A: dados e lógica** | Sonnet 5.5 (high) | `data/`, `requirements.js`, `progress.js`, `firebase.js`, regras do Firestore. |
| **Dev B: interface** | Sonnet 5.5 (high) | HTML, CSS, `render.js`, `main.js`, telas e acessibilidade. |
| **QA 1: testes automatizados** | Haiku 5.5 (extra) | Testes da lógica e validador dos dados. |
| **QA 2: QA manual e revisão** | Haiku 5.5 (extra) | Checklist de telas, responsividade, fluxo de login e conferência dos dados contra a wiki. |
| **Athos** | humano | Aprova decisões, escreve o primeiro rascunho dos dados e revisa o que cada agente entrega. |

Nota: são 5 papéis de agente assumindo dois Haiku. Se for só um, QA 1 e QA 2 viram um único papel.

## 3. Donos de arquivos

Regra principal: **cada arquivo tem um único dono**. Ninguém edita arquivo de outro. Se precisar de mudança, pede ao dono ou ao orquestrador. No estágio 1, o Dev acumula os papéis A e B.

| Caminho | Dono |
|---|---|
| `README.md`, `docs/`, `CONTRACTS.md`, estrutura de pastas | Orquestrador |
| `data/*.json`, `tools/*`, `js/requirements.js`, `js/progress.js`, `js/firebase.js`, `firestore.rules` | Dev A (no estágio 1: Athos escreve `requirements.js` e o rascunho dos dados) |
| `index.html`, `region.html`, `css/*`, `js/main.js`, `js/render.js` | Dev B |
| `tests/*`, `scripts/validate-data.js` | QA 1 |
| `qa/checklist.md`, `qa/reports/*` | QA 2 |

## 4. Contratos entre módulos (`CONTRACTS.md`)

O orquestrador escreve este arquivo **antes** de liberar o trabalho em paralelo. Os contratos abaixo são hipóteses até a fatia vertical provar que funcionam.

- `requirements.js`
  - `isAvailable(itemId, doneSet, items)` retorna boolean
  - `missingFor(itemId, doneSet, items)` retorna a lista de ids pendentes, seguindo a cadeia
  - `regionProgress(regionId, doneSet, items)` retorna `{ done, total }` (só Collectibles)
  - `isRegionAvailable(regionId, doneSet, regions)` retorna boolean
  - `missingForRegion(regionId, doneSet, regions, items)` retorna os ids que faltam para a região ficar disponível
- `progress.js`
  - `loadProgress()` retorna `{ done, visited }` (local primeiro, nuvem se houver login)
  - `setDone(itemId, value)` grava a mudança (local sempre; nuvem se houver login); marca a região como visitada automaticamente
  - `setVisited(regionId, value)` marca ou desmarca uma região como visitada
  - `onProgressChange(callback)` assina atualizações
  - `exportProgress()` e `importProgress(file)`
  - `mergeLocalAndCloud(local, cloud)` regra de conflito no primeiro login (decidir na ADR correspondente)
- `firebase.js`
  - `signIn(provider)`, `signOut()`, `onAuthChange(callback)`

A interface só usa essas funções. Não acessa Firestore, localStorage nem lê JSON de requisitos por conta própria.

## 5. Fases

**Fase 0: Fundação (Orquestrador)**
- Estrutura de pastas, README, `GLOSSARY.md` (na raiz) e `docs/adr/` (ADRs 0001 a 0003 já escritos: local-first com união, Firebase compartilhado, ids permanentes).
- GitHub Pages desde o início: publicar já a fatia vertical, autorizar o domínio do Pages no Firebase Auth e usar caminhos relativos. Conferir se o plano do GitHub permite Pages com repositório privado; se não, o repositório será público e nada sensível pode ir no código.
- `CONTRACTS.md` e dados de exemplo mínimos.
- Convenção de branches: uma por agente.
- Saída: contratos aprovados por Athos.

**Fase 1: Fatia vertical (estágio 1)**
- Uma região, dois itens e uma dependência entre eles.
- `requirements.js` (Athos), progresso local, tela de região, login real.
- Critério: marcar um item libera o outro, o progresso sobrevive a recarregar a página e sincroniza entre dois dispositivos.

**Fase 2: Ampliação (estágio 2, em paralelo)**
- Dev A: restante da lógica, sincronização e `firestore.rules` testadas no Emulator.
- Dev B: telas Início, Região e Pendências, e a tela de conta e backup.
- QA 1: `scripts/validate-data.js` (ids únicos, `requires` válidos, sem ciclos, `missable` coerente) e testes de `requirements.js`.
- QA 2: checklist de QA a partir das telas.

**Fase 3: Dados reais, em lotes (Dev A, com Athos)**
- Primeiro lote: Moss Grotto, The Marrow e Deep Docks (a confirmar na wiki). Cada lote seguinte repete esta fase.
- `tools/draft-from-wiki.js` (Dev A) gera rascunhos a partir da wiki, depois de revisar a licença e os termos de uso. Athos reescreve com palavras próprias e verifica; nada entra em `data/` sem revisão humana.
- Dev A revisa, completa e padroniza. Cada item com `source`, texto com palavras próprias e `dataVersion`.
- QA 1 roda o validador. QA 2 confere uma amostra contra a wiki.

**Fase 4: Integração e QA (Orquestrador)**
- Merges um branch por vez, testes a cada merge.
- QA 2 executa o checklist; achados em `qa/reports/` roteados para o dono do arquivo.
- Repetir até o checklist passar.

## 6. Convenções de trabalho

- **Tarefas pequenas:** objetivo, arquivos tocados e critério de pronto.
- **Handoff:** nota curta com o que mudou, decisões tomadas e dúvidas abertas.
- **Dúvida de contrato:** não improvisar; perguntar ao orquestrador, que atualiza `CONTRACTS.md`.
- **Decisões duráveis:** registrar em `docs/adr/` e usar os termos de `GLOSSARY.md`.
- **Testes sem framework:** usar `node:test` nativo.
- **Segredos:** nenhuma chave ou token no repositório.
- **Explicar decisões:** cada agente registra o porquê das escolhas não óbvias, para Athos acompanhar e aprender.
- **IDs de itens são permanentes:** renomear um id quebra o progresso salvo. Mudanças de conteúdo sobem o `dataVersion`.

## 7. Critérios de pronto da V1

- Validador de dados passa sem erros.
- Testes de `requirements.js` passam, incluindo cadeia de requisitos e caso de ciclo.
- Progresso funciona sem login (localStorage) e exporta e importa em JSON.
- Login funciona e o progresso sincroniza entre dois dispositivos, com conflito local x nuvem resolvido.
- Começa vazio em jogo novo, sem nada marcado por padrão.
- Regiões bloqueadas mostram só o nome e o que falta, e abrem ao cumprir os requisitos; Collectibles de regiões não visitadas ficam escondidos, com opção para mostrar tudo.
- Site publicado no GitHub Pages, com login funcionando no domínio publicado.
- Regras do Firestore testadas no Emulator: cada usuário acessa só o próprio documento, e o Hollow-Thingy continua funcionando.
- Dados com `source` e atribuição, sem texto copiado.
- Checklist de QA sem pendências críticas.
