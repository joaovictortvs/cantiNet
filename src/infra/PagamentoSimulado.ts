import type { GatewayPagamento, ResultadoEstorno } from '../domain/portas/pagamento';
import type { ResultadoCobranca } from '../domain/pagamento';
import type { Cartao } from '../domain/types';

/** Gateway simulado: aprova depois de um atraso e registra os estornos (cada pagamento só é estornado uma vez). */
export class PagamentoSimulado implements GatewayPagamento {
  readonly #estornados = new Set<string>();
  #sequencia = 0;

  constructor(private readonly atrasoMs = 700) {}

  async cobrar(cartao: Cartao, valor: number): Promise<ResultadoCobranca> {
    await this.#esperar();
    if (valor <= 0) return { ok: false, erro: 'Valor inválido.' };
    this.#sequencia += 1;
    return { ok: true, comprovante: `AUT-${Date.now().toString(36).toUpperCase()}${this.#sequencia}-${cartao.ultimos4}` };
  }

  async estornar(comprovante: string, valor: number): Promise<ResultadoEstorno> {
    await this.#esperar();
    if (valor <= 0) return { ok: false, erro: 'Valor inválido.' };
    if (this.#estornados.has(comprovante)) return { ok: false, erro: 'Este pagamento já foi estornado.' };
    this.#estornados.add(comprovante);
    return { ok: true, comprovante: `EST-${comprovante}` };
  }

  #esperar(): Promise<void> {
    return this.atrasoMs <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, this.atrasoMs));
  }
}
