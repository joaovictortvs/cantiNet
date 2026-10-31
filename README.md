# 🍽️ CantiNet — a cantina do CESAR sem fila

> Aplicação web que elimina a fila do intervalo de 15 minutos: o aluno monta um pedido misto, agenda a retirada, paga com o cartão cadastrado em 1 clique e retira mostrando um QR Code. Uma IA (simulada) organiza a cozinha para que tudo fique pronto ao mesmo tempo.

**Entrega 1 · versão "Go Horse"** — funcional, com interface completa, mas com a arquitetura deliberadamente simples. A refatoração orientada a objetos é a **Entrega 2**.

## Dados da entrega

| | |
|---|---|
| **Projeto** | CantiNet (Cantina do CESAR) |
| **Entrega** | 1 — versão "Go Horse" |
| **Livro-base** | *Engenharia de Software Moderna*, Marco Tulio Valente — Capítulo 5 (Princípios de Projeto) |
| **Equipe** | Antônio Neto, Carlos Daniel, Davi Pereira, Davi Braz, João Victor, José Nalbert, Luis Silva, Kauã Mateus |
| **Professor(a)** | Lucas Farias |
| **Vídeo de apresentação (3 min)** | https://youtu.be/PPA3N-5VJz0?si=wXdYHns_CpGBatkd |
| **Repositório** | https://github.com/joaovictortvs/cantiNet |

## O problema

O intervalo dura 15 minutos. Com fila no balcão, pagamento em dinheiro/maquininha e produtos que acabam sem aviso, boa parte desse tempo se perde. A CantiNet ataca os três pontos: pedido antecipado, pagamento no app e estoque visível em tempo real.

## Funcionalidades (requisito → implementação)

| # | Requisito | Como foi atendido | Onde está |
|---|---|---|---|
| 1 | Categorias e controle de estoque | Cardápio em **Pronta-entrega**, **Forno** (capacidade limitada) e **Chapa / feito na hora**, com contagem de estoque por item ("12 em estoque", "Últimas 3", "Esgotado"). O carrinho não permite passar do estoque. | `data/cardapio.ts`, `domain/estoque.ts`, `ui/aluno/CardapioView.tsx` |
| 2 | Pedidos mistos e agendamento "barbearia" | Um pedido aceita itens das 3 categorias. Se houver item de chapa, o aluno escolhe o horário em slots de 5 min, com vagas limitadas por horário. | `domain/agendamento.ts`, `ui/aluno/CarrinhoPanel.tsx` |
| 3 | Pagamento por cartão cadastrado | Cadastro do cartão (só bandeira e 4 últimos dígitos são guardados) e botão "Pagar em 1 clique". Gateway simulado. | `domain/pagamento.ts`, `ui/aluno/CartaoForm.tsx` |
| 4 | Retirada expressa por token | Tela "Meus pedidos" com QR Code, código `CNT-XXXX`, horário e a faixa **PRONTO PARA RETIRADA**. A atendente finaliza com 1 toque. | `domain/pedidos.ts`, `ui/aluno/MeusPedidos.tsx` |
| 5 | Agente de IA orquestrador | Agendamento reverso: calcula o início de forno e chapa a partir do horário de retirada, para tudo terminar junto. Explica a ordem e alerta atrasos e itens que precisam ficar aquecidos. | `domain/ia.ts` |
| 6 | Painel simplificado da atendente | Layout para tablet: abas **Cozinha** e **Estoque**, quadro Na fila → Em preparo → Pronto, botões grandes, baixa automática de estoque a cada venda e reposição rápida. | `ui/atendente/PainelAtendente.tsx` |

## Tecnologias

React 18 · TypeScript (modo `strict`) · Vite 5 · `qrcode.react`. Sem backend e sem banco: todo o estado vive em memória (recarregar a página reinicia a demo).

## Como executar

Pré-requisito: **Node.js 18+**.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (normalmente http://localhost:5173).

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checa os tipos (`tsc --noEmit`) e gera o build de produção |
| `npm run preview` | Serve o build localmente |

**Para testar rápido:** no cadastro do cartão use **"Usar cartão de teste"**. Em **Atendente › Ferramentas de demonstração** há botões para gerar pedidos de exemplo, avançar o relógio em 5 min e reiniciar tudo.

> O app tem duas visões, alternadas no topo: **Aluno** (ideal em celular) e **Atendente** (pensada para tablet).

## Arquitetura (versão Go Horse)

Mesmo sendo a versão rápida, as **regras de negócio ficam separadas da interface**, para facilitar a refatoração da Entrega 2:

```
ui/  (React: telas e estilos)
 │        só apresenta e dispara ações
 ▼
store/store.ts  (estado em memória + orquestração das ações)
 │
 ▼
domain/  (regras puras em TypeScript, sem React)
  estoque · agendamento · ia · pagamento · pedidos · tempo
 ▲
data/cardapio.ts  (cardápio e estoque iniciais)
```

### Estrutura de arquivos

```
cantina-cesar/
├── index.html · package.json · tsconfig.json · vite.config.ts
├── public/
│   └── favicon.svg               # logo (ícone da aba)
└── src/
    ├── main.tsx
    ├── data/cardapio.ts
    ├── domain/
    │   ├── types.ts              # Produto, Pedido, Cartao, TarefaProducao...
    │   ├── estoque.ts            # validar carrinho, baixar/repor estoque
    │   ├── agendamento.ts        # slots de retirada e capacidade da chapa
    │   ├── ia.ts                 # orquestrador de cozinha (mock)
    │   ├── pagamento.ts          # validação/tokenização de cartão + gateway mock
    │   ├── pedidos.ts            # criar pedido, código/token, fluxo de status
    │   └── tempo.ts
    ├── store/store.ts
    └── ui/
        ├── App.tsx · Logo.tsx · styles.css · categorias.ts · formatar.ts
        ├── aluno/                # Cardápio, Carrinho, Cartão, Meus pedidos
        └── atendente/            # Painel (Cozinha / Estoque)
```

## Como a "IA" funciona (simulada)

Não há modelo de linguagem: é um algoritmo determinístico. Para cada pedido, o horário de retirada é o **alvo**; forno e chapa começam em `alvo − tempo de preparo`, então terminam juntos. A cozinha tem 2 bandejas de forno e 2 chapas. Se uma bancada estiver ocupada, o item termina antes e fica **aquecido** até o alvo; se já passou da hora de começar, aparece **iniciar agora** e um alerta de atraso. A interface mostra a ordem sugerida e o motivo ("Por que essa ordem?").

## Princípios de projeto (Capítulo 5)

**Princípio é a regra; propriedade é o ganho.** A tabela organiza o Capítulo 5 desse jeito: cada propriedade (o que o projeto ganha) com os princípios que a produzem, o estado da Entrega 1 e o plano da Entrega 2.

A versão Go Horse **viola de propósito** vários desses princípios. A única exigência da Entrega 1 era manter as regras de negócio separadas da interface, o que já foi feito.

| Propriedade (o ganho) | Princípio (a regra) | Entrega 1 (Go Horse) | Plano da Entrega 2 |
|---|---|---|---|
| **Integridade Conceitual** | — (amarra todas as outras) | ✅ Mesmas convenções em todo o projeto: nomes em português, funções puras em `domain/`, ações na `store`, mesmos componentes visuais (stepper, chips, cores de status) e o mesmo código `CNT-` para todo pedido. | Manter o mesmo padrão ao refatorar. |
| **Coesão** | **Responsabilidade Única (SRP)** | 🟡 Cada arquivo de `domain/` cuida de uma coisa só, e os botões de estoque existem apenas no painel da atendente. Mas `store.ts` acumula estado, orquestração de pagamento, criação de pedido e dados de demonstração. | Separar em `PedidoService`, `EstoqueService` e `PagamentoService`. |
| | **Segregação de Interfaces (ISP)** | ❌ Todo componente recebe o `Estado` inteiro, mesmo usando só uma parte. | Interfaces pequenas por papel, como `LeituraDeEstoque` (aluno) e `ReposicaoDeEstoque` (atendente). |
| **Acoplamento** | **Inversão de Dependências (DIP)** | ❌ A store importa direto `cobrar()` e `criarCardapioInicial()`; só existe pagamento por cartão. | Interfaces `GatewayPagamento` e `RepositorioPedidos`, injetadas na store (cartão, Pix ou vale entram sem refazer o caixa). |
| | **Composição em vez de Herança** | ⚪ Não há herança nem classes; nada a corrigir, mas nada demonstrado. | `Cozinha` composta de `Estações` ("tem um"), sem herança. |
| **Ocultamento de Informação** | **Demeter** | 🟡 Acertos: o estado da store não é exportado (só `useEstado` e `acoes`) e o número do cartão nunca é guardado. Problemas: `Pedido` e `Produto` têm campos públicos e a UI navega em `pedido.itens` e `estado.pedidos`. | Classes com campos privados e métodos (`pedido.iniciarPreparo()`, `produto.baixar(qtd)`, `pedido.resumo()`). |
| **Extensibilidade** | **Aberto/Fechado (OCP)** | 🟡 Produto novo entra com uma linha em `data/cardapio.ts` (um suco de uva novo não reforma a cozinha). Já categoria ou estação nova exige editar `ia.ts` e `agendamento.ts`, que ramificam por `FORNO`, `CHAPA` e `BALCAO`. | Uma estratégia por estação atrás de uma interface comum. |
| | **Substituição de Liskov** | ⚪ Sem subclasses, ainda não se aplica. | As estações implementam a mesma interface e são intercambiáveis. |

Legenda: ✅ atende · 🟡 atende em parte · ❌ viola (planejado) · ⚪ ainda não se aplica.

## Interface e acessibilidade

- **Aluno (celular):** atalhos por categoria, botão flutuante "Ver pedido", horários em botões grandes.
- **Atendente (tablet):** botões de 56 px, uma ação por status, fila da IA fixa ao lado do quadro em telas largas.
- Contraste AA, foco de teclado visível, alvos de toque de pelo menos 44 px, status sempre com texto (nunca só cor) e respeito a `prefers-reduced-motion`.
- As fontes (Bricolage Grotesque e Inter) vêm do Google Fonts; sem internet, o app usa a fonte do sistema.

## Limitações conhecidas

- Dados em memória: recarregar a página zera pedidos e estoque.
- Pagamento simulado (aprova em ~0,7 s); nenhum dado de cartão sai do navegador.
- O QR Code é gerado de verdade, mas não há leitor: a atendente confere pelo código no painel.
- Sem autenticação: "Aluno" e "Atendente" são apenas duas visões do mesmo app.
- Sem testes automatizados nesta entrega.

## Próximos passos (Entrega 2)

- [ ] Refatorar para classes e interfaces aplicando os princípios da tabela acima
- [ ] Extrair as estações da IA como estratégias intercambiáveis
- [ ] Testes unitários das regras de `domain/`
