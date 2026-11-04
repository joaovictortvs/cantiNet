# 🍽️ CantiNet — a cantina do CESAR sem fila

> Pedido antecipado, horário de retirada, pagamento em 1 clique e retirada por QR Code. Uma "IA" organiza a cozinha para que tudo fique pronto ao mesmo tempo.

**Entrega 2 · refatoração orientada a objetos.** A Entrega 1 ("Go Horse") está preservada na tag `entrega1-final`; aqui o mesmo app foi reorganizado aplicando os princípios do Capítulo 5.

## Dados da entrega

| | |
|---|---|
| **Projeto** | CantiNet (Cantina do CESAR) |
| **Entrega** | 2 — refatoração com princípios de projeto |
| **Livro-base** | *Engenharia de Software Moderna*, Marco Tulio Valente — Cap. 5 |
| **Professor(a)** | Lucas Farias |
| **Vídeo da Entrega 1 (3 min)** | https://youtu.be/PPA3N-5VJz0?si=wXdYHns_CpGBatkd |
| **Vídeo da Entrega 2** | [PREENCHER] |
| **Repositório** | https://github.com/joaovictortvs/cantiNet (branch única `entrega2`) |
| **Código da Entrega 1** | tag `entrega1-final` |

### Equipe e papéis

| Integrante | Atividades realizadas |
|---|---|
| João Victor | Organização do repositório (branches, tags, merge e correção do build). Parte central da refatoração aplicando o Cap. 5: modelos com campos privados, portas (interfaces) e serviços do domínio. Camada `app`, `infra` e `composicao.ts`. Parte da interface do aluno e do atendente. Testes automatizados, incluindo o de arquitetura. Edição do vídeo |
| Antônio Neto | Definição dos requisitos e do escopo da entrega. Levantamento dos problemas da Entrega 1 que seriam corrigidos na refatoração. Revisão final do aplicativo antes da entrega |
| Carlos Daniel | Organização das tarefas e dos prazos da equipe. Acompanhamento do andamento da entrega e conferência dos itens exigidos pelo professor |
| Davi Pereira | Revisão das regras do domínio (estoque, pedidos e agendamento) e sugestões de melhoria nos serviços. Testes manuais do fluxo completo do aluno, do cardápio ao pedido |
| Davi Braz | Sugestões de layout e de textos da tela do aluno. Testes manuais da interface (cardápio, carrinho e meus pedidos) e relato de problemas encontrados |
| José Nalbert | Testes manuais do painel do atendente. Conferência dos casos de teste automatizados e sugestão de cenários novos (cartão vencido, estoque esgotado) |
| Luis Silva | Testes manuais de pagamento, estorno e retirada por QR Code. Relato dos bugs encontrados e conferência das correções |
| Kauã Mateus | Revisão do README (tabela de princípios, antes e depois) e do texto de justificativa da stack. Colaboração no roteiro do vídeo |
## Por que essa stack?

**React.** A tela muda o tempo todo (estoque cai a cada venda, horários lotam, o pedido anda de "Na fila" a "Pronto"). Com React descrevemos *como a tela deve ficar para um dado estado* e ele atualiza sozinho. Os componentes pequenos também combinam com a separação aluno × atendente.

**Vite.** Sobe o servidor em instantes e recarrega a página ao salvar, o que importa num projeto de semestre com iteração rápida. Vem com TypeScript pronto e o mesmo Vite roda o Vitest dos testes.

**TypeScript `strict`.** Interfaces e `readonly` ajudam a impor os princípios (o compilador recusa quem tenta mexer no que deveria ser privado).

**Estado em memória.** O foco é a arquitetura, não persistência; sem banco e sem backend a demo roda com `npm install && npm run dev`. Isso só é seguro por causa do **DIP**: o domínio fala com interfaces (`RepositorioPedidos`, `LeituraDeEstoque`, `GatewayPagamento`), então trocar a memória por um banco é escrever uma classe nova em `infra/`, sem mexer nas regras. Custo: recarregar a página zera tudo.

## Como executar

Pré-requisito: Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 99 testes (Vitest)
npm run build    # tsc --noEmit + build de produção
```

Para testar rápido: **"Usar cartão de teste"** no cadastro e, em **Atendente**, os botões **Pedidos de demonstração**, **+5 min** e **Reiniciar**. A leitura de QR pela câmera exige **HTTPS ou localhost**.

## Arquitetura

```
ui/            React: só apresenta e dispara operações      ─┐
app/           visões, operações por papel, fachada          │ depende só de ↓
domain/        entidades, portas (interfaces), serviços, IA  ┘
infra/         implementações das portas (memória, gateway simulado, relógio)
composicao.ts  único lugar que liga as classes concretas
```

Regra de dependência: `ui → app → domain` e `infra → domain`. O teste `arquitetura.test.ts` falha se alguém violar (ex.: `ui` importar `domain`).

```
src/
├── composicao.ts · main.tsx
├── compartilhado/        horário e formatação
├── domain/
│   ├── modelos/          Produto · Pedido · Carrinho (campos #privados)
│   ├── portas/           GatewayPagamento · RepositorioPedidos · LeituraDeEstoque · ReposicaoDeEstoque · Relogio · GeradorDeCodigos
│   ├── servicos/         EstoqueService · PagamentoService · PedidoService · AgendamentoService · CheckoutService · RetiradaService
│   ├── cozinha/          Estacao (interface) · Cozinha · Forno, Chapa, Balcão, Liquidificador
│   ├── agendamento.ts · ia.ts · cartao.ts · estorno.ts · retirada.ts
│   └── __tests__/
├── app/                  Apresentador · SessaoDoAluno · PainelDaAtendente · DemonstracaoDoSistema · FachadaDaCantina · visoes · operacoes
├── infra/                CatalogoEmMemoria · RepositorioPedidosEmMemoria · PagamentoSimulado · relogios · geradoresDeCodigo
└── ui/                   contexto (hooks por papel) · aluno/ · atendente/
```

## Princípios (Capítulo 5): antes e depois

**Princípio é a regra; propriedade é o ganho.**

| Propriedade | Princípio | Entrega 1 | Entrega 2 (onde ver) |
|---|---|---|---|
| **Integridade Conceitual** | — | ✅ | ✅ Mesmos nomes e padrões em todas as camadas. |
| **Coesão** | **SRP** | 🟡 `store.ts` (268 linhas) fazia estado, pagamento, pedidos e demo. | ✅ Um serviço por responsabilidade: `EstoqueService`, `PagamentoService`, `PedidoService`, `AgendamentoService`; `CheckoutService` só orquestra. A `store` foi removida. |
| | **ISP** | ❌ Todo componente recebia o `Estado` inteiro. | ✅ `OperacoesDoCarrinho`, `OperacoesDePagamento`, `OperacoesDaCozinha`, `OperacoesDeEstoque`, `FerramentasDeDemonstracao`; hooks (`useCardapio`, `usePainel`...) entregam só a fatia do papel. Portas pequenas: `LeituraDeEstoque` (aluno) × `ReposicaoDeEstoque` (atendente); `ConsultaDePedidos` × `RegistroDePedidos`. |
| **Acoplamento** | **DIP** | ❌ A store importava `cobrar()` e o cardápio. | ✅ Serviços recebem `GatewayPagamento`, `RepositorioPedidos`, `LeituraDeEstoque`, `Relogio` e `GeradorDeCodigos` por construtor; `composicao.ts` liga tudo. Os testes usam gateway e catálogo falsos. |
| | **Composição > Herança** | ⚪ | ✅ `Cozinha` é composta de `Estacao`s; `CheckoutService` compõe serviços. Sem herança. |
| **Ocultamento de Informação** | **Demeter** | 🟡 Dados abertos; a UI navegava em `pedido.itens` e `estado.pedidos`. | ✅ `Produto.#estoque` (`baixar/repor`), `Pedido.#status` (`iniciarPreparo/marcarPronto/entregar`), `Carrinho.#quantidades`. A UI só recebe **visões** (dados simples) montadas pelo `Apresentador` e nunca importa `domain`. |
| **Extensibilidade** | **OCP** | 🟡 Estação nova exigia editar `ia.ts`. | ✅ `Estacao` é uma interface: o **Liquidificador** (sucos) entrou com uma classe + uma linha em `criarEstacoesPadrao()`. `ia.ts` e `Cozinha.ts` não citam estação concreta (testado). Retirada por QR entrou como nova `ConfirmacaoDeRetirada`. |
| | **Liskov** | ⚪ | ✅ Forno, Chapa, Balcão e Liquidificador são intercambiáveis na `Cozinha`. |

Legenda: ✅ atende · 🟡 em parte · ❌ violava · ⚪ não se aplicava.

## Novidades da Entrega 2

- **Estações plugáveis + linha do tempo.** O painel da atendente mostra um gráfico por bancada (faixa tracejada = item pronto esperando) que se reorganiza sozinho quando o plano muda.
- **Retirada por câmera.** O tablet lê o QR Code do pedido (`jsqr`) e marca como entregue; só entrega pedido **Pronto**, e uma segunda leitura avisa que já foi entregue.
- **Correções.** Cartão vencido agora é recusado (vale até o último dia do mês, usando o relógio injetado). O **estorno** é de verdade: se o estoque acaba durante o pagamento, `PagamentoService` chama `GatewayPagamento.estornar` e só mostra a mensagem de estorno se ele deu certo; se falhar, a mensagem diz isso e traz o comprovante.
- **Limpeza final.** Removidos `store/store.ts`, `ui/categorias.ts` e `ui/formatar.ts`, que sobraram da Entrega 1; sem eles o `npm run build` e o teste de arquitetura passam.

## Testes

Começamos pelos testes do agendamento e da "IA" para proteger a refatoração. Todos continuaram passando depois dela. Total: **99 testes**: agendamento, IA, cozinha/estações, cartão, pagamento, retirada, entidades (campos privados), serviços com fakes, fluxo completo pela fachada e **arquitetura** (regras de dependência e OCP).

## Limitações conhecidas

- Dados em memória (recarregar zera tudo); pagamento simulado.
- O QR Code **não é assinado**: contém só o código do pedido. Em produção, precisaria de token com assinatura.
- `agendamento.ts` ainda tem a regra "chapa limita horários" por categoria; uma estação nova que também limite vagas por horário exigiria generalizar esse arquivo.
- Sem autenticação: "Aluno" e "Atendente" são duas visões do mesmo app.
