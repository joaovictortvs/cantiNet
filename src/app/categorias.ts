import type { Categoria } from '../domain/types';

/** Como cada categoria aparece na tela. Categoria nova = uma entrada aqui + produtos no cardápio. */
export interface ApresentacaoDaCategoria {
  readonly id: Categoria;
  readonly titulo: string;
  readonly descricao: string;
  readonly icone: string;
  readonly classe: string;
  readonly unidade: string;
}

export const CATEGORIAS: readonly ApresentacaoDaCategoria[] = [
  { id: 'PRONTA_ENTREGA', titulo: 'Pronta-entrega', descricao: 'Pegou, pagou, saiu. Estoque em tempo real.', icone: '⚡', classe: 'cat-pronta', unidade: 'em estoque' },
  { id: 'FORNO', titulo: 'Forno', descricao: 'Salgados quentinhos. Capacidade limitada por fornada.', icone: '🔥', classe: 'cat-forno', unidade: 'na fornada' },
  { id: 'CHAPA', titulo: 'Chapa · feito na hora', descricao: 'Escolha o horário de retirada, como na barbearia.', icone: '🍳', classe: 'cat-chapa', unidade: 'porções' },
  { id: 'SUCO_NATURAL', titulo: 'Sucos naturais', descricao: 'Espremido na hora, em poucos minutos.', icone: '🍊', classe: 'cat-suco', unidade: 'em estoque' },
];

export const ROTULO_STATUS = {
  AGUARDANDO: 'Na fila',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
} as const;
