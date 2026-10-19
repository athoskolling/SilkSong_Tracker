# Silksong Guide — Estrutura do projeto

Documento de planejamento. Nenhum código ainda: serve de contexto para começar o desenvolvimento no Claude Code.

## 1. Visão

Guia de progresso para Hollow Knight: Silksong, pensado para zerar o jogo com a porcentagem máxima: coletar tudo e fazer todos os finais.

O usuário segue o guia, marca o que concluiu e vê o que falta. O site começa vazio (jogo novo), sem nenhum progresso fixo no código.

Diferença em relação ao Hollow-Thingy: aqui o foco é **guia** (ordem sugerida, requisitos, avisos de itens perdíveis, o que desbloqueia o quê), não só checklist.

## 2. Decisões já tomadas

- Repositório novo e separado (criado depois, com calma).
- Stack igual à do Hollow-Thingy: HTML + CSS + JavaScript puro, sem framework e sem backend próprio.
- Login e sincronização: reaproveitar o Firebase (Auth + Firestore) do Hollow-Thingy, com dados do Silksong em coleção separada.
- Sem mapa visual do jogo. Só texto e checklists.
- Visual minimalista, nada com cara de "feito por IA".
- Fonte de dados: wiki principal do jogo, com MapGenie como apoio quando faltar informação.
- **Local primeiro:** o progresso é salvo no navegador (localStorage) por padrão e sincronizado com o Firestore depois do login. O site é usável sem conta.
- **Backup:** exportar e importar o progresso em JSON.
- **Idioma do site:** somente inglês (nomes, textos e interface). Sem camada de tradução.
- **Dois tipos de entrada:** Collectible (conta para o progresso) e Task (rastreada, mas não conta). Os contadores "X de Y" usam só Collectibles. Ver `GLOSSARY.md`.
- **Finais no modelo da V1:** cinco finais nos dados, com requisitos e aviso de `locksOut`. A tela completa de finais fica fora da V1. `missable` nas entradas é opcional e padrão `false`.
- **Contagens próprias:** contadores por categoria ("Tools: 12 of 51"), sem afirmar reproduzir a porcentagem do jogo.
- **Uma run por conta** na V1. "New run" oferece exportar antes de zerar.
- **Primeiro login:** união do progresso local com o da nuvem; depois, a última escrita vence.
- **Spoilers:** Collectibles de regiões não visitadas ficam escondidos por padrão, com opção para mostrar tudo.
- **Firebase:** projeto compartilhado; regras só são publicadas depois de passar nos testes do Emulator.
- **Fatia vertical antes de paralelizar:** uma região, dois itens, cadeia de requisitos funcionando e login real, de ponta a ponta. Só então ampliar.
- **Rota global:** `step` é uma única sequência para todas as regiões; as páginas de região são visões filtradas dessa rota.
- **Regiões "visited" e "available":** *visited* é marcado à mão e também automaticamente ao concluir algo na região (controla os spoilers). *Available* é calculado pelos `requires` da região, em função do progresso.
- **Regiões bloqueadas:** aparecem só com o nome e o que falta (por exemplo, "needs Swift Step"); abrem quando os requisitos são cumpridos.
- **Todas as regiões no modelo, conteúdo em lotes:** o modelo e a interface suportam o jogo inteiro desde o início; o conteúdo é publicado em lotes, só depois de verificado.
- **Tasks na V1:** apenas as que destravam um Collectible.
- **Sub-áreas:** rótulo de texto (`area`) em cada entrada, sem páginas ou desbloqueio próprios.
- **Autoria dos dados:** rascunhos assistidos por script a partir da wiki, sempre reescritos e verificados por uma pessoa (ver seção 8).
- **Hospedagem:** GitHub Pages desde o início (ver seção 10).
- **ADRs escritos:** `0001` (local-first com união), `0002` (Firebase compartilhado) e `0003` (ids permanentes), em `docs/adr/`.

## 3. Escopo da V1

Dentro:
- Modelo de dados e interface prontos para todas as regiões; conteúdo publicado em lotes. Primeiro lote: Moss Grotto, The Marrow e Deep Docks (ordem inicial do jogo; confirmar na wiki).
- Rota global (`step`) e regiões bloqueadas com "o que falta".
- Tracking de itens por região (marcar como coletado).
- Visão "o que falta": pendências por região e requisitos para liberar o próximo item ou área.
- Progresso local + exportar/importar JSON.
- Login Firebase e sincronização entre dispositivos.
- Campos de guia no modelo de dados: `missable`, `step` e `spoiler` (a interface pode usá-los de forma simples na V1).

Fora da V1 (ficam para depois):
- Conteúdo das regiões fora do primeiro lote (entra em lotes seguintes, conforme verificado).
- Leitura automática do save.
- Lista completa de finais e porcentagem total.
- Busca, filtros avançados e modo offline completo.

## 4. Estrutura de pastas (proposta)

```
silksong-guide/
├── index.html            # tela inicial: visão geral do progresso
├── region.html           # página de uma região (recebe ?id=...)
├── css/
│   ├── base.css          # reset, variáveis, tipografia
│   └── components.css    # checklist, cards, barras de progresso
├── js/
│   ├── main.js           # ponto de entrada
│   ├── firebase.js       # init + auth + Firestore (reaproveitado)
│   ├── progress.js       # local (localStorage), Firestore, exportar/importar
│   ├── requirements.js   # resolve requisitos: "o que falta para X"
│   └── render.js         # montar a interface a partir dos dados
├── data/
│   ├── regions.json      # lista de regiões
│   ├── items.json        # itens coletáveis
│   └── endings.json      # os cinco finais, condições e locksOut
├── tools/
│   └── draft-from-wiki.js    # gera rascunhos a partir da wiki (revisão humana obrigatória)
├── docs/
│   ├── silksong-estrutura.md   # este documento
│   └── adr/                    # decisões de arquitetura
├── GLOSSARY.md           # vocabulário do projeto
└── README.md
```

Princípio: **conteúdo do jogo** (`data/`) é separado do **progresso do usuário** (localStorage e Firestore). Atualizar o guia nunca mexe no progresso salvo.

## 5. Modelo de dados

### Região (`regions.json`)
- `id` (slug estável, ex.: `moss-grotto`)
- `name`
- `order` (posição sugerida no guia)
- `summary` (texto curto, escrito com palavras próprias)
- `requires` (lista de ids de itens ou habilidades necessários para entrar/avançar; define quando a região fica *available*; vazio = disponível desde o início)

### Item (`items.json`)
- `id` (slug estável; **nunca renomear** depois de publicado, pois o progresso salvo aponta para ele)
- `name`
- `kind` (`collectible` ou `task`; só `collectible` conta nos contadores)
- `type` (ex.: ability, tool, crest, upgrade, boss, quest)
- `regionId`
- `area` (rótulo opcional de sub-área, ex.: Bone Bottom; só texto)
- `how` (como obter, curto, escrito com palavras próprias)
- `requires` (lista de ids que precisam ser obtidos antes)
- `unlocks` (opcional; pode ser derivado de `requires`)
- `missable` (boolean; se pode ser perdido em algum momento)
- `missableNote` (opcional; quando e por quê)
- `step` (posição na rota global: uma única sequência para todas as regiões)
- `spoiler` (nível 0, 1 ou 2; permite esconder itens antes de você chegar neles)
- `source` (link da wiki ou do MapGenie; é referência, não cópia)

### Final (`endings.json`)
- `id`, `name`, `conditions` (lista de ids de itens/eventos)
- `locksOut` (lista de ids de finais que deixam de ser alcançáveis depois deste)
- Na V1: os cinco finais, com requisitos e `locksOut`, preenchidos a partir da wiki.

### Metadados dos dados
- `dataVersion` no topo de cada arquivo de `data/`, incrementado a cada revisão de conteúdo (patch ou DLC).

### Progresso do usuário
- **Local:** chave única no localStorage, com `{ done, updatedAt, dataVersion }`.
- **Nuvem:** documento por usuário em `silksong_progress/{uid}`, com o mesmo formato.
- `done`: mapa `{ [itemId]: true }`.
- `visited`: mapa `{ [regionId]: true }`, marcado à mão ou automaticamente ao concluir algo na região.
- Só guarda ids concluídos. Nada de texto do jogo duplicado.
- **Exportar/importar:** o mesmo objeto, em um arquivo `.json`.

## 6. Lógica central: requisitos

`requirements.js` deve responder duas perguntas a partir de `requires`:

1. **Disponível agora?** Todos os requisitos do item estão em `done`?
2. **O que falta para chegar lá?** Lista dos requisitos ainda não concluídos, seguindo a cadeia (requisito de requisito).

Pontos de atenção: ciclos nos dados (validar), ids inexistentes (validar ao carregar) e itens sem requisitos (sempre disponíveis).

As regiões usam a mesma lógica: uma região é *available* quando todos os `requires` dela estão em `done`. Caso contrário fica *locked*, e a interface mostra só o nome e o que falta (a lista de pendências da própria região).

## 7. Telas da V1

1. **Início:** progresso por região (barra + contagem) e destaque do que está disponível agora.
2. **Região:** checklist dos itens da região, com requisitos pendentes visíveis e avisos de itens perdíveis. Região bloqueada mostra só o nome e o que falta; Collectibles de regiões não visitadas ficam escondidos (com opção para mostrar tudo).
3. **Pendências:** tudo que falta para liberar o próximo item ou área.
4. **Conta e backup:** entrar com a conta já usada no Hollow-Thingy (Google, GitHub ou link por e-mail); exportar e importar progresso.

## 8. Dados: licença e precisão

- Wiki e MapGenie são **referência**. O conteúdo é escrito com palavras próprias, com link em `source`. Não copiar texto nem fazer scraping dos dados do MapGenie.
- **Script de rascunho (`tools/draft-from-wiki.js`):** só lê a wiki principal, só depois de revisar os termos de uso e a licença do conteúdo dela, e respeitando limites de requisições. A saída é rascunho: uma pessoa reescreve cada texto com palavras próprias e confere o fato antes de entrar em `data/`. Imagens e áudio do jogo nunca são copiados (a própria wiki os marca como uso justo, não como conteúdo livre).
- Conferir uma amostra de itens contra a wiki a cada revisão de dados.
- Antes de publicar, rever os termos de uso e a licença de cada fonte e incluir atribuição na página.

## 9. Firebase

- O projeto Firebase é o mesmo do Hollow-Thingy, então uma regra errada pode afetar o outro site.
- Testar as regras no Firebase Emulator antes de publicá-las.
- Se o risco não valer a economia de configuração, criar um projeto separado.
- As regras devem permitir que cada usuário leia e escreva apenas o próprio documento.

## 10. Hospedagem

- GitHub Pages desde o início, para testar no celular.
- Autorizar o domínio do Pages (`<usuário>.github.io`) nos domínios autorizados do Firebase Auth; sem isso o login falha.
- Conferir se o plano do GitHub permite Pages com repositório privado. Se não permitir, o repositório será público: nenhum segredo no código e regras do Firestore estritas (a configuração web do Firebase não é segredo, as regras é que protegem os dados).
- Usar caminhos relativos nos arquivos, porque o Pages serve o site em um subcaminho (`/<repositório>/`).

## 11. Pontos em aberto

- Confirmar na wiki as três primeiras regiões do lote 1 e o escopo exato de cada um.
- Revisar a licença e os termos de uso da wiki antes de usar o script de rascunho.
- Estratégia de atualização dos dados quando o jogo receber patches ou DLC.
- Nome e criação do repositório (quando você criar) e se ele será privado ou público.
- Como lidar com rota global quando um mesmo `step` depende de escolha do jogador (finais com `locksOut`).

## 12. Como trabalhar com o Claude Code

- Dar este documento, o plano de execução e o `GLOSSARY.md` como contexto inicial.
- Seguir em passos pequenos: primeiro a fatia vertical (uma região, dois itens), depois ampliar.
- Athos escreve o primeiro rascunho de `regions.json` e o módulo `requirements.js`; o Claude Code revisa e explica.
- Usar o Claude Code como revisor e guia: tentar cada parte antes, pedir revisão e pedir explicação das decisões.
