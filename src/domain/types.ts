export type Categoria = 'PRONTA_ENTREGA' | 'FORNO' | 'CHAPA' | 'SUCO_NATURAL';
export type StatusPedido = 'AGUARDANDO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE';
export type Estacao = 'FORNO' | 'CHAPA' | 'BALCAO';

/** Contrato de LEITURA de um produto. Quem altera o estoque é a classe Produto (domain/modelos). */
export interface Produto {
  readonly id: string;
  readonly nome: string;
  readonly categoria: Categoria;
  readonly preco: number;
  readonly emoji: string;
  /** Pronta-entrega: unidades na prateleira. Forno: unidades na fornada. Chapa: porcoes que a cozinha consegue fazer. */
  readonly estoque: number;
  readonly tempoPreparoMin: number;
}

export interface ItemCarrinho {
  readonly produtoId: string;
  readonly quantidade: number;
}

export interface ItemPedido {
  readonly produtoId: string;
  readonly nome: string;
  readonly categoria: Categoria;
  readonly emoji: string;
  readonly quantidade: number;
  readonly precoUnit: number;
  readonly tempoPreparoMin: number;
}

export interface Cartao {
  readonly titular: string;
  readonly ultimos4: string;
  readonly bandeira: string;
  readonly validade: string;
  readonly tipo: 'CREDITO' | 'DEBITO';
}

/** Contrato de LEITURA de um pedido. O status só muda pelos métodos da classe Pedido (domain/modelos). */
export interface Pedido {
  readonly id: string;
  readonly codigo: string;
  readonly aluno: string;
  readonly itens: readonly ItemPedido[];
  readonly total: number;
  /** Minuto do dia (0-1439) em que o pedido deve estar pronto para retirada. */
  readonly retiradaMin: number;
  readonly criadoEmMin: number;
  readonly status: StatusPedido;
  readonly pagoCom: string;
}

export interface TarefaProducao {
  pedidoId: string;
  codigo: string;
  aluno: string;
  /** Id da estação: 'forno', 'chapa', 'balcao', 'liquidificador'... (novas estações entram sem mudar este tipo). */
  estacao: string;
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