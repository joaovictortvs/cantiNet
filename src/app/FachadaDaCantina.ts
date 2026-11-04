import type { DadosCartao } from '../domain/pagamento';
import type { ResultadoRetirada } from '../domain/retirada';
import type { Resultado } from '../domain/Resultado';
import type { Apresentador } from './Apresentador';
import type { DemonstracaoDoSistema } from './DemonstracaoDoSistema';
import type {
  FerramentasDeDemonstracao,
  OperacoesDaCozinha,
  OperacoesDeEstoque,
  OperacoesDePagamento,
  OperacoesDoCarrinho,
} from './operacoes';
import type { PainelDaAtendente } from './PainelDaAtendente';
import type { SessaoDoAluno } from './SessaoDoAluno';
import type { Instantaneo } from './visoes';

const OPERACOES = [
  'adicionar', 'alterarQuantidade', 'escolherHorario', 'cadastrarCartao', 'removerCartao', 'pagar',
  'avancarPedido', 'confirmarRetirada', 'reporEstoque', 'adiantarRelogio', 'gerarPedidosDeDemonstracao', 'reiniciar', 'atualizar',
] as const;

/** Tudo o que a cantina é por dentro. `reiniciar` constrói um mundo novo, do zero. */
export interface Mundo {
  readonly sessao: SessaoDoAluno;
  readonly painel: PainelDaAtendente;
  readonly demo: DemonstracaoDoSistema;
  readonly apresentador: Apresentador;
}

/**
 * Ponto único de entrada da interface. Guarda o "mundo", avisa os ouvintes a cada mudança e
 * entrega um retrato imutável (Instantaneo) que o React lê com useSyncExternalStore.
 * Não tem regra de negócio: só delega para os serviços (SRP).
 */
export class FachadaDaCantina
  implements OperacoesDoCarrinho, OperacoesDePagamento, OperacoesDaCozinha, OperacoesDeEstoque, FerramentasDeDemonstracao
{
  #mundo: Mundo;
  #versao = 0;
  #instantaneo: Instantaneo;
  readonly #ouvintes = new Set<() => void>();

  constructor(private readonly criarMundo: () => Mundo) {
    this.#mundo = criarMundo();
    this.#instantaneo = this.#mundo.apresentador.instantaneo(this.#mundo.sessao, this.#versao);
    // Quem recebe só uma operação (ex.: `const { pagar } = cantina`) não pode perder o `this`.
    for (const nome of OPERACOES) this[nome] = this[nome].bind(this) as never;
  }

  // ---- leitura reativa -------------------------------------------------
  inscrever = (ouvinte: () => void): (() => void) => {
    this.#ouvintes.add(ouvinte);
    return () => {
      this.#ouvintes.delete(ouvinte);
    };
  };

  instantaneo = (): Instantaneo => this.#instantaneo;

  /** Recalcula o retrato (ex.: o relógio andou). */
  atualizar(): void {
    this.#publicar();
  }

  // ---- carrinho --------------------------------------------------------
  adicionar(produtoId: string): void {
    this.#mundo.sessao.adicionar(produtoId);
    this.#publicar();
  }
  alterarQuantidade(produtoId: string, delta: number): void {
    this.#mundo.sessao.alterarQuantidade(produtoId, delta);
    this.#publicar();
  }
  escolherHorario(minuto: number | null): void {
    this.#mundo.sessao.escolherHorario(minuto);
    this.#publicar();
  }

  // ---- pagamento -------------------------------------------------------
  cadastrarCartao(dados: DadosCartao): Resultado<true> {
    const r = this.#mundo.sessao.cadastrarCartao(dados);
    this.#publicar();
    return r;
  }
  removerCartao(): void {
    this.#mundo.sessao.removerCartao();
    this.#publicar();
  }
  async pagar(): Promise<Resultado<true>> {
    const sessao = this.#mundo.sessao;
    const r = await sessao.pagar(() => this.#publicar());
    if (this.#mundo.sessao === sessao) this.#publicar();
    return r;
  }

  // ---- cozinha e estoque -----------------------------------------------
  avancarPedido(pedidoId: string): void {
    this.#mundo.painel.avancarPedido(pedidoId);
    this.#publicar();
  }
  confirmarRetirada(forma: string, entrada: string): ResultadoRetirada {
    const r = this.#mundo.painel.confirmarRetirada(forma, entrada);
    this.#publicar();
    return r;
  }
  reporEstoque(produtoId: string, quantidade: number): void {
    this.#mundo.painel.reporEstoque(produtoId, quantidade);
    this.#publicar();
  }

  // ---- demonstração ----------------------------------------------------
  adiantarRelogio(minutos: number): void {
    this.#mundo.demo.adiantarRelogio(minutos);
    this.#publicar();
  }
  gerarPedidosDeDemonstracao(): void {
    this.#mundo.demo.gerarPedidos();
    this.#publicar();
  }
  reiniciar(): void {
    this.#mundo = this.criarMundo();
    this.#publicar();
  }

  #publicar(): void {
    this.#versao += 1;
    this.#instantaneo = this.#mundo.apresentador.instantaneo(this.#mundo.sessao, this.#versao);
    this.#ouvintes.forEach((ouvinte) => ouvinte());
  }
}
