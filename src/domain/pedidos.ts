import type { ItemCarrinho, ItemPedido, Pedido, Produto, StatusPedido } from './types';

export function montarItens(produtos: Produto[], carrinho: ItemCarrinho[]): ItemPedido[] {
  const itens: ItemPedido[] = [];
  for (const c of carrinho) {
    const p = produtos.find((x) => x.id === c.produtoId);
    if (!p) continue;
    itens.push({
      produtoId: p.id,
      nome: p.nome,
      categoria: p.categoria,
      emoji: p.emoji,
      quantidade: c.quantidade,
      precoUnit: p.preco,
      tempoPreparoMin: p.tempoPreparoMin,
    });
  }
  return itens;
}

export function totalDosItens(itens: ItemPedido[]): number {
  return itens.reduce((s, i) => s + i.precoUnit * i.quantidade, 0);
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function gerarCodigo(): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return `CNT-${s}`;
}

export interface NovoPedido {
  id: string;
  aluno: string;
  itens: ItemPedido[];
  retiradaMin: number;
  criadoEmMin: number;
  pagoCom: string;
}

export function criarPedido(n: NovoPedido): Pedido {
  return {
    id: n.id,
    codigo: gerarCodigo(),
    aluno: n.aluno,
    itens: n.itens,
    total: totalDosItens(n.itens),
    retiradaMin: n.retiradaMin,
    criadoEmMin: n.criadoEmMin,
    status: 'AGUARDANDO',
    pagoCom: n.pagoCom,
  };
}

const FLUXO: StatusPedido[] = ['AGUARDANDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'];

export function proximoStatus(s: StatusPedido): StatusPedido {
  const i = FLUXO.indexOf(s);
  return FLUXO[Math.min(i + 1, FLUXO.length - 1)];
}
