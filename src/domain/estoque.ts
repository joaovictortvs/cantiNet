import type { ItemCarrinho, Produto } from './types';

export function buscarProduto(produtos: Produto[], id: string): Produto | undefined {
  return produtos.find((p) => p.id === id);
}

export function quantidadeNoCarrinho(carrinho: ItemCarrinho[], id: string): number {
  return carrinho.find((i) => i.produtoId === id)?.quantidade ?? 0;
}

/** Retorna lista de erros (vazia = carrinho valido frente ao estoque atual). */
export function validarCarrinho(produtos: Produto[], carrinho: ItemCarrinho[]): string[] {
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

export function baixarEstoque(produtos: Produto[], itens: ItemCarrinho[]): Produto[] {
  return produtos.map((p) => {
    const item = itens.find((i) => i.produtoId === p.id);
    return item ? { ...p, estoque: Math.max(0, p.estoque - item.quantidade) } : p;
  });
}

export function reporEstoque(produtos: Produto[], id: string, qtd: number): Produto[] {
  return produtos.map((p) => (p.id === id ? { ...p, estoque: Math.max(0, p.estoque + qtd) } : p));
}
