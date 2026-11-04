import type { Pedido } from '../modelos/Pedido';

/** Quem só LÊ pedidos (agendamento, IA, telas) depende só disto (ISP). */
export interface ConsultaDePedidos {
  todos(): readonly Pedido[];
  porId(id: string): Pedido | undefined;
  porCodigo(codigo: string): Pedido | undefined;
  doAluno(aluno: string): readonly Pedido[];
}

/** Quem CRIA pedidos precisa só disto. */
export interface RegistroDePedidos {
  adicionar(pedido: Pedido): void;
  proximoId(): string;
}

export interface RepositorioPedidos extends ConsultaDePedidos, RegistroDePedidos {}
