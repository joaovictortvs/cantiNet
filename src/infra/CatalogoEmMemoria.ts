import { Produto } from '../domain/modelos/Produto';
import type { DadosDoProduto } from '../domain/modelos/Produto';
import type { LeituraDeEstoque } from '../domain/portas/estoque';

/** Cardápio em memória. Trocar por um banco = nova classe que implementa LeituraDeEstoque. */
export class CatalogoEmMemoria implements LeituraDeEstoque {
  readonly #produtos: readonly Produto[];

  constructor(dados: readonly DadosDoProduto[]) {
    this.#produtos = dados.map((d) => new Produto(d));
  }

  produtos(): readonly Produto[] {
    return this.#produtos;
  }

  produto(id: string): Produto | undefined {
    return this.#produtos.find((p) => p.id === id);
  }
}
