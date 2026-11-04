import type { EstoqueService } from '../domain/servicos/EstoqueService';
import type { PedidoService } from '../domain/servicos/PedidoService';
import type { RetiradaService } from '../domain/servicos/RetiradaService';
import type { ResultadoRetirada } from '../domain/retirada';
import type { OperacoesDaCozinha, OperacoesDeEstoque } from './operacoes';

/** Tudo o que a atendente faz: tocar o pedido adiante, confirmar retirada e repor estoque. */
export class PainelDaAtendente implements OperacoesDaCozinha, OperacoesDeEstoque {
  constructor(
    private readonly pedidos: PedidoService,
    private readonly retirada: RetiradaService,
    private readonly estoque: EstoqueService,
  ) {}

  avancarPedido(pedidoId: string): void {
    this.pedidos.avancar(pedidoId);
  }

  confirmarRetirada(forma: string, entrada: string): ResultadoRetirada {
    return this.retirada.confirmar(forma, entrada);
  }

  reporEstoque(produtoId: string, quantidade: number): void {
    this.estoque.repor(produtoId, quantidade);
  }
}
