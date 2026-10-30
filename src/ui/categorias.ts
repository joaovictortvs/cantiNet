import type { Categoria } from '../domain/types';

export const ORDEM_CATEGORIAS: Categoria[] = ['PRONTA_ENTREGA', 'FORNO', 'CHAPA'];

export const META_CATEGORIA: Record<
  Categoria,
  { titulo: string; descricao: string; icone: string; classe: string; unidade: string }
> = {
  PRONTA_ENTREGA: {
    titulo: 'Pronta-entrega',
    descricao: 'Pegou, pagou, saiu. Estoque em tempo real.',
    icone: '⚡',
    classe: 'cat-pronta',
    unidade: 'em estoque',
  },
  FORNO: {
    titulo: 'Forno',
    descricao: 'Salgados quentinhos. Capacidade limitada por fornada.',
    icone: '🔥',
    classe: 'cat-forno',
    unidade: 'na fornada',
  },
  CHAPA: {
    titulo: 'Chapa · feito na hora',
    descricao: 'Escolha o horário de retirada, como na barbearia.',
    icone: '🍳',
    classe: 'cat-chapa',
    unidade: 'porções',
  },
};

export const ROTULO_STATUS = {
  AGUARDANDO: 'Na fila',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
} as const;
