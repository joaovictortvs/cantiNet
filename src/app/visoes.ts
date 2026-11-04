import type { DadosCartao } from '../domain/pagamento';
import type { ResultadoRetirada } from '../domain/retirada';
import type { Resultado } from '../domain/Resultado';
import type { PlanoProducao, StatusPedido, TarefaProducao } from '../domain/types';

export type PlanoVisao = PlanoProducao;
export type TarefaVisao = TarefaProducao;
export type StatusVisao = StatusPedido;

/**
 * Visões: o que a tela enxerga. São dados simples e imutáveis montados pelo Apresentador;
 * a interface nunca recebe (nem navega em) objetos do domínio — Lei de Demeter.
 */
export interface ProdutoVisao {
  readonly id: string;
  readonly nome: string;
  readonly emoji: string;
  readonly preco: number;
  readonly tempoPreparoMin: number;
  readonly estoque: number;
  readonly unidade: string;
  readonly nivelDoEstoque: 'ok' | 'baixo' | 'zero';
  readonly quantidadeNoCarrinho: number;
  readonly podeAumentar: boolean;
}

export interface CategoriaVisao {
  readonly id: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly icone: string;
  readonly classe: string;
  readonly produtos: readonly ProdutoVisao[];
}

export interface ItemDoCarrinhoVisao {
  readonly produtoId: string;
  readonly nome: string;
  readonly emoji: string;
  readonly quantidade: number;
  readonly subtotal: number;
}

export interface HorarioVisao {
  readonly minuto: number;
  readonly vagas: number;
  readonly disponivel: boolean;
}

export interface CartaoVisao {
  readonly descricao: string;
  readonly bandeira: string;
  readonly ultimos4: string;
  readonly tipo: 'CREDITO' | 'DEBITO';
}

export type BloqueioDoPagamento = 'CARRINHO_VAZIO' | 'SEM_CARTAO' | 'SEM_HORARIO' | 'PROCESSANDO';

export interface CarrinhoVisao {
  readonly itens: readonly ItemDoCarrinhoVisao[];
  readonly quantidadeTotal: number;
  readonly total: number;
  readonly exigeHorario: boolean;
  readonly horarios: readonly HorarioVisao[];
  readonly horarioEscolhido: number | null;
  readonly retiradaPrevista: number | null;
  readonly cartao: CartaoVisao | null;
  readonly processandoPagamento: boolean;
  /** `null` = pode pagar. */
  readonly bloqueio: BloqueioDoPagamento | null;
}

export interface ItemDoPedidoVisao {
  readonly produtoId: string;
  readonly nome: string;
  readonly emoji: string;
  readonly quantidade: number;
  readonly classeDaCategoria: string;
}

export interface PedidoVisao {
  readonly id: string;
  readonly codigo: string;
  readonly aluno: string;
  readonly status: StatusPedido;
  readonly rotuloDoStatus: string;
  readonly retiradaMin: number;
  readonly itens: readonly ItemDoPedidoVisao[];
  readonly total: number;
  readonly pagoCom: string;
  /** Texto gravado no QR Code do aluno. */
  readonly textoDoQr: string;
}

export interface PainelVisao {
  readonly naFila: readonly PedidoVisao[];
  readonly emPreparo: readonly PedidoVisao[];
  readonly prontos: readonly PedidoVisao[];
  readonly entregues: number;
  readonly emAndamento: number;
  readonly plano: PlanoVisao;
  /** Mesma estrutura do cardápio, para a reposição de estoque. */
  readonly estoque: readonly CategoriaVisao[];
}

/** Retrato completo da cantina num instante; a interface lê fatias dele (ISP). */
export interface Instantaneo {
  readonly versao: number;
  readonly agoraMin: number;
  readonly cardapio: readonly CategoriaVisao[];
  readonly carrinho: CarrinhoVisao;
  readonly meusPedidos: readonly PedidoVisao[];
  readonly meusPedidosAtivos: number;
  readonly painel: PainelVisao;
}

export type { DadosCartao, Resultado, ResultadoRetirada };
