import { mensagemEstorno } from '../estorno';
import { detectarBandeira, tokenizarCartao, validarCartao } from '../pagamento';
import type { DadosCartao } from '../pagamento';
import type { GatewayPagamento } from '../portas/pagamento';
import type { Relogio } from '../portas/relogio';
import { falha, sucesso } from '../Resultado';
import type { Resultado } from '../Resultado';
import type { Cartao } from '../types';

export { detectarBandeira };

/** Cadastro do cartão, cobrança e estorno. Conhece o gateway só pela interface GatewayPagamento. */
export class PagamentoService {
  constructor(
    private readonly gateway: GatewayPagamento,
    private readonly relogio: Relogio,
  ) {}

  /** Valida (inclusive a validade, contra a data de hoje do relógio) e guarda só o que é seguro exibir. */
  cadastrarCartao(dados: DadosCartao): Resultado<Cartao> {
    const erro = validarCartao(dados, this.relogio.hoje());
    return erro ? falha(erro) : sucesso(Object.freeze(tokenizarCartao(dados)));
  }

  async cobrar(cartao: Cartao, valor: number): Promise<Resultado<{ comprovante: string }>> {
    const r = await this.gateway.cobrar(cartao, valor);
    return r.ok && r.comprovante ? sucesso({ comprovante: r.comprovante }) : falha(r.erro ?? 'Pagamento recusado.');
  }

  /**
   * Devolve o valor ao cartão. Só devolve a mensagem "estorno solicitado" se o gateway
   * realmente aceitou o estorno; se falhar, o erro diz isso e traz o comprovante.
   */
  async estornar(comprovante: string, valor: number, cartao: Cartao, codigoPedido?: string): Promise<Resultado<string>> {
    const r = await this.gateway.estornar(comprovante, valor);
    return r.ok
      ? sucesso(mensagemEstorno({ valor, ultimos4: cartao.ultimos4, codigoPedido }))
      : falha(`Não foi possível concluir o estorno (${r.erro ?? 'gateway indisponível'}). Guarde o comprovante ${comprovante}.`);
  }
}
