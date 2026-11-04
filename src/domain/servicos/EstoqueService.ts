import type { Carrinho, LeituraDoCarrinho } from '../modelos/Carrinho';
import { validarCarrinho } from '../estoque';
import type { LeituraDeEstoque, ReposicaoDeEstoque } from '../portas/estoque';
import { falha, sucesso } from '../Resultado';
import type { Resultado } from '../Resultado';
import type { ItemCarrinho } from '../types';

/** Regras de estoque: validar o carrinho, baixar na venda e repor. Não sabe de pagamento nem de pedido. */
export class EstoqueService implements ReposicaoDeEstoque {
  constructor(private readonly catalogo: LeituraDeEstoque) {}

  /** Mensagens de problema do carrinho frente ao estoque atual (vazio = tudo certo). */
  problemasDo(carrinho: LeituraDoCarrinho): string[] {
    return validarCarrinho(this.catalogo.produtos(), carrinho.itens);
  }

  /** Muda a quantidade no carrinho sem passar do que existe em estoque. */
  alterarQuantidade(carrinho: Carrinho, produtoId: string, delta: number): void {
    const produto = this.catalogo.produto(produtoId);
    if (!produto) return;
    carrinho.definirQuantidade(produtoId, Math.min(produto.estoque, carrinho.quantidadeDe(produtoId) + delta));
  }

  /** Baixa tudo ou nada: se algum item faltar, nada é baixado. */
  baixar(itens: readonly ItemCarrinho[]): Resultado<true> {
    const problemas = validarCarrinho(this.catalogo.produtos(), itens);
    if (problemas.length > 0) return falha(problemas[0]);
    for (const { produtoId, quantidade } of itens) this.catalogo.produto(produtoId)?.baixar(quantidade);
    return sucesso(true);
  }

  repor(produtoId: string, quantidade: number): void {
    this.catalogo.produto(produtoId)?.repor(quantidade);
  }
}
