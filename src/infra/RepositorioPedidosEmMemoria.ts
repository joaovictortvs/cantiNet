import type { Pedido } from '../domain/modelos/Pedido';
import type { RepositorioPedidos } from '../domain/portas/pedidos';

export class RepositorioPedidosEmMemoria implements RepositorioPedidos {
  readonly #pedidos: Pedido[] = [];
  #contador = 0;

  todos(): readonly Pedido[] {
    return [...this.#pedidos];
  }

  porId(id: string): Pedido | undefined {
    return this.#pedidos.find((p) => p.id === id);
  }

  porCodigo(codigo: string): Pedido | undefined {
    return this.#pedidos.find((p) => p.codigo === codigo);
  }

  doAluno(aluno: string): readonly Pedido[] {
    return this.#pedidos.filter((p) => p.aluno === aluno);
  }

  adicionar(pedido: Pedido): void {
    this.#pedidos.push(pedido);
  }

  proximoId(): string {
    this.#contador += 1;
    return `P${this.#contador}`;
  }
}
