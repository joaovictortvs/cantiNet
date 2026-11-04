import type { ItemCarrinho } from '../types';

/** O que quem só precisa LER o carrinho enxerga (Segregação de Interfaces). */
export interface LeituraDoCarrinho {
  readonly itens: readonly ItemCarrinho[];
  quantidadeDe(produtoId: string): number;
  estaVazio(): boolean;
}

/** Carrinho do aluno: só guarda produto e quantidade. Regras de estoque ficam no EstoqueService. */
export class Carrinho implements LeituraDoCarrinho {
  #quantidades = new Map<string, number>();

  get itens(): readonly ItemCarrinho[] {
    return [...this.#quantidades].map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
  }

  quantidadeDe(produtoId: string): number {
    return this.#quantidades.get(produtoId) ?? 0;
  }

  /** Define a quantidade de um produto; zero (ou menos) remove o item. */
  definirQuantidade(produtoId: string, quantidade: number): void {
    if (!Number.isInteger(quantidade)) throw new Error('A quantidade deve ser um número inteiro.');
    if (quantidade <= 0) this.#quantidades.delete(produtoId);
    else this.#quantidades.set(produtoId, quantidade);
  }

  limpar(): void {
    this.#quantidades.clear();
  }

  estaVazio(): boolean {
    return this.#quantidades.size === 0;
  }
}
