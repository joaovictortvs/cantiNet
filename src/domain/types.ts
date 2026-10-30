export type Categoria = 'PRONTA_ENTREGA' | 'FORNO' | 'CHAPA';
export type StatusPedido = 'AGUARDANDO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE';
export type Estacao = 'FORNO' | 'CHAPA' | 'BALCAO';

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  preco: number;
  emoji: string;
  /** Pronta-entrega: unidades na prateleira. Forno: unidades na fornada. Chapa: porcoes que a cozinha consegue fazer. */
  estoque: number;
  tempoPreparoMin: number;
}

export interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
}

export interface ItemPedido {
  produtoId: string;
  nome: string;
  categoria: Categoria;
  emoji: string;
  quantidade: number;
  precoUnit: number;
  tempoPreparoMin: number;
}

export interface Cartao {
  titular: string;
  ultimos4: string;
  bandeira: string;
  validade: string;
  tipo: 'CREDITO' | 'DEBITO';
}

export interface Pedido {
  id: string;
  codigo: string;
  aluno: string;
  itens: ItemPedido[];
  total: number;
  /** Minuto do dia (0-1439) em que o pedido deve estar pronto para retirada. */
  retiradaMin: number;
  criadoEmMin: number;
  status: StatusPedido;
  pagoCom: string;
}

export interface TarefaProducao {
  pedidoId: string;
  codigo: string;
  aluno: string;
  estacao: Estacao;
  bancada: string;
  descricao: string;
  inicioMin: number;
  fimMin: number;
  alvoMin: number;
  /** Minutos que o item fica pronto antes do alvo (precisa ser mantido aquecido). */
  aquecidoMin: number;
  iniciarAgora: boolean;
  atrasoMin: number;
  emAndamento: boolean;
  ordem: number;
}

export interface PlanoProducao {
  tarefas: TarefaProducao[];
  alertas: string[];
  explicacoes: string[];
  resumo: string;
}
