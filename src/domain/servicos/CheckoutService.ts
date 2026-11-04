import type { Carrinho } from '../modelos/Carrinho';
import type { Pedido } from '../modelos/Pedido';
import { totalDosItens } from '../pedidos';
import { falha, sucesso } from '../Resultado';
import type { Resultado } from '../Resultado';
import type { Cartao } from '../types';
import type { AgendamentoService } from './AgendamentoService';
import type { EstoqueService } from './EstoqueService';
import type { PagamentoService } from './PagamentoService';
import type { PedidoService } from './PedidoService';

export const HORARIO_INDISPONIVEL = 'HORARIO_INDISPONIVEL';
export const ESTOQUE_ESGOTADO_NO_PAGAMENTO = 'ESTOQUE_ESGOTADO_NO_PAGAMENTO';

export interface CompraParaFinalizar {
  readonly aluno: string;
  readonly carrinho: Carrinho;
  readonly cartao: Cartao | null;
  readonly horarioEscolhido: number | null;
}

/** Finalizar compra: valida → cobra → baixa o estoque → cria o pedido (ou estorna). Só orquestra os outros serviços. */
export class CheckoutService {
  constructor(
    private readonly estoque: EstoqueService,
    private readonly agendamento: AgendamentoService,
    private readonly pagamento: PagamentoService,
    private readonly pedidos: PedidoService,
  ) {}

  async finalizar(compra: CompraParaFinalizar): Promise<Resultado<Pedido>> {
    if (!compra.cartao) return falha('Cadastre um cartão para pagar.');
    const problemas = this.estoque.problemasDo(compra.carrinho);
    if (problemas.length > 0) return falha(problemas[0]);

    const opcoes = this.agendamento.opcoesPara(compra.carrinho);
    let retirada = opcoes.retiradaPrevista;
    if (opcoes.exigeHorario) {
      if (compra.horarioEscolhido === null) return falha('Escolha o horário de retirada.');
      if (!this.agendamento.horarioContinuaValido(compra.carrinho, compra.horarioEscolhido)) {
        return falha('Esse horário acabou de lotar. Escolha outro.', HORARIO_INDISPONIVEL);
      }
      retirada = compra.horarioEscolhido;
    }

    const itens = this.agendamento.itensDoCarrinho(compra.carrinho);
    const total = totalDosItens(itens);
    const cobranca = await this.pagamento.cobrar(compra.cartao, total);
    if (!cobranca.ok) return cobranca;

    // O estoque pode ter acabado enquanto o pagamento era processado.
    const baixa = this.estoque.baixar(itens);
    if (!baixa.ok) {
      const estorno = await this.pagamento.estornar(cobranca.valor.comprovante, total, compra.cartao);
      return falha(
        `O estoque acabou durante o pagamento. ${estorno.ok ? estorno.valor : estorno.erro}`,
        ESTOQUE_ESGOTADO_NO_PAGAMENTO,
      );
    }

    const cartao = compra.cartao;
    return sucesso(
      this.pedidos.criar({
        aluno: compra.aluno,
        itens,
        retiradaMin: retirada ?? 0,
        pagoCom: `${cartao.bandeira} •••• ${cartao.ultimos4}`,
      }),
    );
  }

  /** Registra um pedido já pago (usado pela demonstração): valida e baixa o estoque. */
  registrarPedidoPago(aluno: string, carrinho: Carrinho, retiradaMin: number, pagoCom: string): Resultado<Pedido> {
    const baixa = this.estoque.baixar(carrinho.itens);
    if (!baixa.ok) return baixa;
    return sucesso(this.pedidos.criar({ aluno, itens: this.agendamento.itensDoCarrinho(carrinho), retiradaMin, pagoCom }));
  }
}
