import type { Categoria, Produto as ContratoDoProduto } from '../types';

export type DadosDoProduto = ContratoDoProduto;

/**
 * Produto do cardápio. O estoque é um campo `#privado`: só muda por baixar() e repor(),
 * que garantem que ele nunca fique negativo (Ocultamento de Informação).
 */
export class Produto implements ContratoDoProduto {
  readonly id: string;
  readonly nome: string;
  readonly categoria: Categoria;
  readonly preco: number;
  readonly emoji: string;
  readonly tempoPreparoMin: number;
  #estoque: number;

  constructor(dados: DadosDoProduto) {
    if (!Number.isInteger(dados.estoque) || dados.estoque < 0) throw new Error(`Estoque inicial inválido para ${dados.nome}.`);
    if (dados.preco < 0) throw new Error(`Preço inválido para ${dados.nome}.`);
    this.id = dados.id;
    this.nome = dados.nome;
    this.categoria = dados.categoria;
    this.preco = dados.preco;
    this.emoji = dados.emoji;
    this.tempoPreparoMin = dados.tempoPreparoMin;
    this.#estoque = dados.estoque;
  }

  get estoque(): number {
    return this.#estoque;
  }

  temEstoque(quantidade = 1): boolean {
    return quantidade <= this.#estoque;
  }

  baixar(quantidade: number): void {
    this.#exigirQuantidadeValida(quantidade);
    if (quantidade > this.#estoque) throw new Error(`Estoque insuficiente de ${this.nome}: restam ${this.#estoque}.`);
    this.#estoque -= quantidade;
  }

  repor(quantidade: number): void {
    this.#exigirQuantidadeValida(quantidade);
    this.#estoque += quantidade;
  }

  #exigirQuantidadeValida(quantidade: number): void {
    if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error('A quantidade deve ser um inteiro positivo.');
  }
}
