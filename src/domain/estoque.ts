import type { ItemCarrinho, Produto } from './types';

export function buscarProduto(produtos: readonly Produto[], id: string): Produto | undefined {
  return produtos.find((p) => p.id === id);
}

export function quantidadeNoCarrinho(carrinho: readonly ItemCarrinho[], id: string): number {
  return carrinho.find((i) => i.produtoId === id)?.quantidade ?? 0;
}

/** Retorna lista de erros (vazia = carrinho valido frente ao estoque atual). */
export function validarCarrinho(produtos: readonly Produto[], carrinho: readonly ItemCarrinho[]): string[] {
  const erros: string[] = [];
  if (carrinho.length === 0) erros.push('Seu carrinho está vazio.');
  for (const item of carrinho) {
    const p = buscarProduto(produtos, item.produtoId);
    if (!p) {
      erros.push('Produto inexistente no cardápio.');
    } else if (item.quantidade > p.estoque) {
      erros.push(
        p.estoque === 0
          ? `${p.nome} esgotou.`
          : `${p.nome}: só restam ${p.estoque} unidade(s).`,
      );
    }
  }
  return erros;
}
