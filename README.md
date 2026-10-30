# CantiNet · a cantina do CESAR — Entrega 1 (versão "Go Horse")

SPA em **React + TypeScript (Vite)**. Tudo roda em memória: sem banco, sem backend, sem deploy.

## Como executar

Pré-requisito: Node.js 18+.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (normalmente http://localhost:5173).
Para checar tipos e gerar o build de produção: `npm run build` (e `npm run preview`).

## Estrutura de arquivos

```
cantina-cesar/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── favicon.svg               # logo da CantiNet (ícone da aba)
└── src/
    ├── main.tsx                  # ponto de entrada React
    ├── data/
    │   └── cardapio.ts           # cardápio e estoque inicial (em memória)
    ├── domain/                   # REGRAS DE NEGÓCIO (sem React)
    │   ├── types.ts              # Produto, Pedido, Cartao, TarefaProducao...
    │   ├── estoque.ts            # validar carrinho, baixar/repor estoque
    │   ├── agendamento.ts        # horários "barbearia" e capacidade da chapa
    │   ├── ia.ts                 # IA orquestradora (mock): ordem de produção
    │   ├── pagamento.ts          # validação/tokenização de cartão + gateway mock
    │   ├── pedidos.ts            # criar pedido, código/token, fluxo de status
    │   └── tempo.ts              # utilidades de horário
    ├── store/
    │   └── store.ts              # estado em memória + ações (cola domínio ↔ UI)
    └── ui/                       # CAMADA VISUAL
        ├── App.tsx               # cabeçalho, troca Aluno/Atendente, relógio
        ├── Logo.tsx              # logo da CantiNet (SVG): tigela + arcos de sinal
        ├── styles.css
        ├── categorias.ts         # rótulos/cores das categorias e status
        ├── formatar.ts
        ├── aluno/
        │   ├── AlunoView.tsx     # abas Cardápio / Meus pedidos
        │   ├── CardapioView.tsx  # 3 categorias com contagem de estoque
        │   ├── CarrinhoPanel.tsx # pedido misto, horário, cartão, pagar em 1 clique
        │   ├── CartaoForm.tsx    # cadastro do cartão
        │   └── MeusPedidos.tsx   # QR Code + status "Pronto para Retirada"
        └── atendente/
            └── PainelAtendente.tsx  # abas Cozinha/Estoque, fila da IA, quadro de pedidos
```

## Interface e acessibilidade

- **Aluno (celular):** cardápio com atalhos por categoria, botão flutuante "Ver pedido", slots de horário grandes e QR Code em destaque.
- **Atendente (tablet, paisagem ou retrato):** abas **Cozinha** e **Estoque**; botões de ação com 56 px de altura, uma ação por status (Iniciar preparo → Marcar pronto → Entregar). Em tela larga a fila da IA fica fixa ao lado do quadro de pedidos; em tela menor ela aparece acima.
- Contraste de texto AA, foco de teclado visível, alvos de toque de pelo menos 44 px, status nunca só por cor (sempre com texto) e `prefers-reduced-motion` respeitado.
- As fontes (Bricolage Grotesque e Inter) vêm do Google Fonts; sem internet o app usa a fonte do sistema.
- As ferramentas de demonstração ficam recolhidas no rodapé do painel da atendente.

## Roteiro do screencast (3 minutos)

**Antes de gravar:** em Atendente › Ferramentas de demonstração, clique em **↺ Reiniciar**. Deixe o zoom do navegador em 110% e feche as outras abas. Para o aluno, use o DevTools em modo celular; para a atendente, uma janela larga (1024 px ou mais). Use o cartão de teste para não digitar nada na frente da câmera.

| Tempo | Tela | O que fazer | O que falar |
|---|---|---|---|
| **0:00–0:15** | Aluno | Mostrar o logo, o nome CantiNet e o banner "Escolha, Pague, Retire". | "O intervalo tem 15 minutos e a fila do balcão come metade dele. A CantiNet é a cantina do CESAR sem fila: o aluno pede antes e retira na hora." |
| **0:15–0:40** | Aluno › Cardápio | Clicar nos chips Pronta-entrega, Forno e Chapa e apontar as contagens de estoque. | "O cardápio é dividido pelo jeito de preparar. A contagem de estoque aparece em tempo real, então ninguém vai ao balcão à toa quando o produto acaba." |
| **0:40–1:10** | Aluno › Carrinho | Adicionar 2 tapiocas, 1 coxinha e 1 brigadeiro e escolher um horário de retirada. | "Dá para misturar categorias no mesmo pedido. Como tem chapa, o aluno agenda o horário, como na barbearia, e cada horário tem vagas limitadas." |
| **1:10–1:30** | Aluno › Pagamento | Clicar em "Usar cartão de teste", Salvar cartão e Pagar em 1 clique. | "O cartão é cadastrado uma vez. O pagamento é em um clique, sem dinheiro nem maquininha no balcão." |
| **1:30–1:45** | Aluno › Meus pedidos | Mostrar o QR Code, o código CNT e o horário de retirada. | "Este é o token do pedido. Na hora de retirar, o aluno só mostra esta tela." |
| **1:45–2:25** | Atendente › Cozinha | Gerar os pedidos de demonstração e destacar a fila da IA e o "Por que essa ordem?". | "A IA da CantiNet olha todos os pedidos e calcula quando começar cada item. O forno começa antes e a chapa depois, e tudo termina junto no horário combinado. Se faltar bancada, ela avisa o atraso ou manda manter o item aquecido." |
| **2:25–2:45** | Atendente → Aluno | Clicar em "Iniciar preparo" e depois "Marcar pronto" no seu pedido, voltar ao aluno e mostrar a faixa verde. No painel, clicar em "Entregar" e abrir a aba Estoque. | "A atendente avança o pedido com um toque. O aluno vê PRONTO PARA RETIRADA, ela entrega, finaliza, e o estoque já baixou sozinho." |
| **2:45–3:00** | Qualquer tela do app | Voltar à tela do aluno, com o logo visível. | "Esta é a versão Go Horse da CantiNet: já funciona, mas a store concentra responsabilidades demais. Na Entrega 2 vamos refatorar com SRP, DIP, OCP, Demeter e ocultamento de informação." |

Dicas para não estourar o tempo:

- Ensaie uma vez com cronômetro. A parte mais longa é a da IA (1:45), então treine essa fala.
- Se passar de 3:00, corte a aba Estoque e encurte a abertura.
- Gere os pedidos de demonstração só depois de fazer o seu pedido de verdade (no passo de 1:45).
- Para o "PRONTO" aparecer a tempo, avance o seu pedido no painel assim que entrar nele, sem esperar o relógio.

## Como a "IA" funciona (mock)

Agendamento reverso: para cada pedido, o horário de retirada é o alvo; forno e chapa começam em `alvo − tempo de preparo`, então tudo termina junto. Há 2 bandejas de forno e 2 chapas. Se uma bancada estiver ocupada, o item termina antes e fica **aquecido** até o alvo. Se já passou da hora de começar, aparece **iniciar agora** e um alerta de atraso.

## Dívidas técnicas assumidas (alvo da Entrega 2)

Esta versão separa regras de negócio (`domain/`) da interface (`ui/`), mas de propósito deixa pontos para refatorar:

| Princípio | Onde aplicar |
|---|---|
| **SRP** | `store.ts` acumula estado, orquestração de pagamento, criação de pedido e dados de demo. |
| **DIP** | A store depende direto de `cobrar()` e de `criarCardapioInicial()`; extrair interfaces (`GatewayPagamento`, `RepositorioPedidos`). |
| **OCP** | `ia.ts` e `agendamento.ts` usam `if/switch` por categoria (`FORNO`/`CHAPA`/`BALCAO`); modelar `Estacao` como estratégia/polimorfismo para criar novas categorias sem editar código existente. |
| **Demeter** | Componentes percorrem `estado.pedidos[...].itens[...]` e a UI conhece detalhes de `Pedido`. |
| **Ocultamento de informação** | Interfaces com campos públicos e mutáveis (`Pedido.status`, `Produto.estoque`); virar classes com métodos (`pedido.iniciarPreparo()`, `produto.baixar(qtd)`). |

## Limitações do protótipo

- Dados em memória: recarregar a página zera tudo.
- Pagamento é simulado (aprova em ~0,7 s); só guardamos bandeira e 4 últimos dígitos.
- O QR Code é gerado de verdade (`qrcode.react`), mas não há leitor; a atendente confere pelo código no painel.
