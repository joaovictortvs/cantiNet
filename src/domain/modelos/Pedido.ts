import type { ItemPedido, Pedido as ContratoDoPedido, StatusPedido } from '../types';
import { totalDosItens } from '../pedidos';

export interface DadosDoPedido {
  readonly id: string;
  readonly codigo: string;
  readonly aluno: string;
  readonly itens: readonly ItemPedido[];
  readonly retiradaMin: number;
  readonly criadoEmMin: number;
  readonly pagoCom: string;
}

/**
 * Pedido pago. O status e os itens são privados: o status só muda pelo ciclo de vida
 * (iniciarPreparo → marcarPronto → entregar) e uma transição inválida lança erro.
 * Quem precisa de uma informação pergunta ao pedido (Demeter), em vez de navegar nele.
 */
export class Pedido implements ContratoDoPedido {
  readonly id: string;
  readonly codigo: string;
  readonly aluno: string;
  readonly retiradaMin: number;
  readonly criadoEmMin: number;
  readonly pagoCom: string;
  readonly #itens: readonly ItemPedido[];
  #status: StatusPedido = 'AGUARDANDO';

  constructor(dados: DadosDoPedido) {
    if (dados.itens.length === 0) throw new Error('Um pedido precisa de pelo menos um item.');
    this.id = dados.id;
    this.codigo = dados.codigo;
    this.aluno = dados.aluno;
    this.retiradaMin = dados.retiradaMin;
    this.criadoEmMin = dados.criadoEmMin;
    this.pagoCom = dados.pagoCom;
    this.#itens = Object.freeze(dados.itens.map((item) => Object.freeze({ ...item })));
  }

  get status(): StatusPedido {
    return this.#status;
  }

  get itens(): readonly ItemPedido[] {
    return this.#itens;
  }

  get total(): number {
    return totalDosItens(this.#itens);
  }

  estaAtivo(): boolean {
    return this.#status === 'AGUARDANDO' || this.#status === 'EM_PREPARO';
  }

  estaPronto(): boolean {
    return this.#status === 'PRONTO';
  }

  foiEntregue(): boolean {
    return this.#status === 'ENTREGUE';
  }

  /** Ex.: "2× Tapioca de queijo, 1× Coxinha". */
  resumo(): string {
    return this.#itens.map((item) => `${item.quantidade}× ${item.nome}`).join(', ');
  }

  iniciarPreparo(): void {
    this.#transitar('AGUARDANDO', 'EM_PREPARO');
  }

  marcarPronto(): void {
    this.#transitar('EM_PREPARO', 'PRONTO');
  }

  entregar(): void {
    this.#transitar('PRONTO', 'ENTREGUE');
  }

  /** Avança para a próxima etapa; um pedido já entregue não muda. */
  avancar(): void {
    if (this.#status === 'AGUARDANDO') this.iniciarPreparo();
    else if (this.#status === 'EM_PREPARO') this.marcarPronto();
    else if (this.#status === 'PRONTO') this.entregar();
  }

  #transitar(de: StatusPedido, para: StatusPedido): void {
    if (this.#status !== de) throw new Error(`Pedido ${this.codigo}: não é possível ir de ${this.#status} para ${para}.`);
    this.#status = para;
  }
}
