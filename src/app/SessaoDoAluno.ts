import { Carrinho } from '../domain/modelos/Carrinho';
import type { LeituraDoCarrinho } from '../domain/modelos/Carrinho';
import type { AgendamentoService } from '../domain/servicos/AgendamentoService';
import type { CheckoutService } from '../domain/servicos/CheckoutService';
import type { EstoqueService } from '../domain/servicos/EstoqueService';
import type { PagamentoService } from '../domain/servicos/PagamentoService';
import { falha, sucesso } from '../domain/Resultado';
import type { Resultado } from '../domain/Resultado';
import type { Cartao } from '../domain/types';
import type { DadosCartao } from '../domain/pagamento';
import type { OperacoesDoCarrinho, OperacoesDePagamento } from './operacoes';

export const ALUNO_ATUAL = 'Você';

/** O que o Apresentador precisa saber da sessão do aluno (só leitura). */
export interface EstadoDaSessao {
  readonly aluno: string;
  readonly carrinho: LeituraDoCarrinho;
  readonly horarioEscolhido: number | null;
  readonly cartao: Cartao | null;
  readonly processandoPagamento: boolean;
}

/** Tudo o que o aluno faz: montar o carrinho, escolher horário, cadastrar cartão e pagar. */
export class SessaoDoAluno implements OperacoesDoCarrinho, OperacoesDePagamento, EstadoDaSessao {
  readonly aluno = ALUNO_ATUAL;
  readonly #carrinho = new Carrinho();
  #horarioEscolhido: number | null = null;
  #cartao: Cartao | null = null;
  #processando = false;

  constructor(
    private readonly estoque: EstoqueService,
    private readonly agendamento: AgendamentoService,
    private readonly pagamento: PagamentoService,
    private readonly checkout: CheckoutService,
  ) {}

  get carrinho(): LeituraDoCarrinho {
    return this.#carrinho;
  }
  get horarioEscolhido(): number | null {
    return this.#horarioEscolhido;
  }
  get cartao(): Cartao | null {
    return this.#cartao;
  }
  get processandoPagamento(): boolean {
    return this.#processando;
  }

  adicionar(produtoId: string): void {
    this.alterarQuantidade(produtoId, 1);
  }

  alterarQuantidade(produtoId: string, delta: number): void {
    this.estoque.alterarQuantidade(this.#carrinho, produtoId, delta);
    // Mudou o carrinho: o horário escolhido pode ter deixado de valer.
    if (!this.agendamento.horarioContinuaValido(this.#carrinho, this.#horarioEscolhido)) this.#horarioEscolhido = null;
  }

  escolherHorario(minuto: number | null): void {
    this.#horarioEscolhido = minuto;
  }

  cadastrarCartao(dados: DadosCartao): Resultado<true> {
    const r = this.pagamento.cadastrarCartao(dados);
    if (!r.ok) return r;
    this.#cartao = r.valor;
    return sucesso(true);
  }

  removerCartao(): void {
    this.#cartao = null;
  }

  /** `aoMudar` avisa a tela quando "processando" liga e desliga. */
  async pagar(aoMudar: () => void = () => undefined): Promise<Resultado<true>> {
    if (this.#processando) return falha('Pagamento em andamento.');
    this.#processando = true;
    aoMudar();
    try {
      const r = await this.checkout.finalizar({
        aluno: this.aluno,
        carrinho: this.#carrinho,
        cartao: this.#cartao,
        horarioEscolhido: this.#horarioEscolhido,
      });
      if (r.ok) {
        this.#carrinho.limpar();
        this.#horarioEscolhido = null;
        return sucesso(true);
      }
      if (r.codigo === 'HORARIO_INDISPONIVEL') this.#horarioEscolhido = null;
      return r;
    } finally {
      this.#processando = false;
    }
  }
}
