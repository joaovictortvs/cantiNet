import { Pedido } from '../modelos/Pedido';
import type { GeradorDeCodigos } from '../portas/codigos';
import type { RepositorioPedidos } from '../portas/pedidos';
import type { Relogio } from '../portas/relogio';
import { falha, sucesso } from '../Resultado';
import type { Resultado } from '../Resultado';
import type { ItemPedido } from '../types';

export interface NovoPedido {
  readonly aluno: string;
  readonly itens: readonly ItemPedido[];
  readonly retiradaMin: number;
  readonly pagoCom: string;
}

/** Cria pedidos e conduz o ciclo de vida (na fila → em preparo → pronto → entregue). */
export class PedidoService {
  constructor(
    private readonly repositorio: RepositorioPedidos,
    private readonly codigos: GeradorDeCodigos,
    private readonly relogio: Relogio,
  ) {}

  criar(novo: NovoPedido): Pedido {
    const pedido = new Pedido({
      id: this.repositorio.proximoId(),
      codigo: this.codigos.proximo(),
      aluno: novo.aluno,
      itens: novo.itens,
      retiradaMin: novo.retiradaMin,
      criadoEmMin: this.relogio.agoraEmMin(),
      pagoCom: novo.pagoCom,
    });
    this.repositorio.adicionar(pedido);
    return pedido;
  }

  avancar(pedidoId: string): Resultado<Pedido> {
    const pedido = this.repositorio.porId(pedidoId);
    if (!pedido) return falha('Pedido não encontrado.');
    pedido.avancar();
    return sucesso(pedido);
  }
}
