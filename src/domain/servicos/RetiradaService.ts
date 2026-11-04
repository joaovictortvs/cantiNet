import { ConfirmacaoPorCodigo, ConfirmacaoPorQrCode } from '../retirada';
import type { ConfirmacaoDeRetirada, RepositorioRetirada, ResultadoRetirada } from '../retirada';
import type { ConsultaDePedidos } from '../portas/pedidos';

/** Liga a retirada aos pedidos reais, expondo só o que ela precisa (ISP): achar por código e marcar entregue. */
export class RetiradaDePedidos implements RepositorioRetirada {
  constructor(private readonly pedidos: ConsultaDePedidos) {}

  buscarPorCodigo(codigo: string) {
    return this.pedidos.porCodigo(codigo);
  }

  marcarEntregue(pedidoId: string): void {
    this.pedidos.porId(pedidoId)?.entregar();
  }
}

export type FormaDeRetirada = 'codigo' | 'qrcode';

/** Escolhe a forma de confirmação. Forma nova (NFC, biometria...) = classe nova registrada aqui. */
export class RetiradaService {
  readonly #formas: ReadonlyMap<string, ConfirmacaoDeRetirada>;

  constructor(formas: ReadonlyMap<string, ConfirmacaoDeRetirada>) {
    this.#formas = formas;
  }

  confirmar(forma: string, entrada: string): ResultadoRetirada {
    const confirmacao = this.#formas.get(forma);
    if (!confirmacao) return { ok: false, motivo: 'FORMATO_INVALIDO', mensagem: 'Forma de confirmação desconhecida.' };
    return confirmacao.confirmar(entrada);
  }

  static padrao(pedidos: ConsultaDePedidos): RetiradaService {
    const repo = new RetiradaDePedidos(pedidos);
    return new RetiradaService(new Map<string, ConfirmacaoDeRetirada>([
      ['codigo', new ConfirmacaoPorCodigo(repo)],
      ['qrcode', new ConfirmacaoPorQrCode(repo)],
    ]));
  }
}
