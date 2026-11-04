import type { Produto } from '../modelos/Produto';

/** Papel do aluno: só enxerga o cardápio e o estoque. */
export interface LeituraDeEstoque {
  produtos(): readonly Produto[];
  produto(id: string): Produto | undefined;
}

/** Papel da atendente: repõe o estoque. */
export interface ReposicaoDeEstoque {
  repor(produtoId: string, quantidade: number): void;
}
