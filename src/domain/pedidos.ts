import type { ItemCarrinho, ItemPedido, Produto } from './types';

/** Congela os dados do produto no momento da compra (preço, nome, tempo de preparo). */
export function montarItens(produtos: readonly Produto[], carrinho: readonly ItemCarrinho[]): ItemPedido[] {
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

export function totalDosItens(itens: readonly ItemPedido[]): number {
  return itens.reduce((s, i) => s + i.precoUnit * i.quantidade, 0);
}
