import type { Cartao } from '../types';
import type { ResultadoCobranca } from '../pagamento';

export interface ResultadoEstorno {
  ok: boolean;
  erro?: string;
  /** Código do estorno, quando deu certo. */
  comprovante?: string;
}

/**
 * Porta de pagamento. O domínio só conhece este contrato: cartão simulado, Pix ou vale
 * entram como novas implementações, sem mexer em quem cobra (DIP + OCP).
 */
export interface GatewayPagamento {
  cobrar(cartao: Cartao, valor: number): Promise<ResultadoCobranca>;
  estornar(comprovante: string, valor: number): Promise<ResultadoEstorno>;
}
