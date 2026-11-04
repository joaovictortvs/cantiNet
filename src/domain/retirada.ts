export type StatusRetirada = "AGUARDANDO" | "EM_PREPARO" | "PRONTO" | "ENTREGUE";

export interface PedidoRetirada {
  id: string;
  codigo: string;
  status: StatusRetirada;
}

/** Só o que a retirada precisa da store (ISP + DIP). */
export interface RepositorioRetirada {
  buscarPorCodigo(codigo: string): PedidoRetirada | undefined;
  marcarEntregue(pedidoId: string): void;
}

export type ResultadoRetirada =
  | { ok: true; pedidoId: string; codigo: string }
  | {
      ok: false;
      motivo: "FORMATO_INVALIDO" | "NAO_ENCONTRADO" | "NAO_PRONTO" | "JA_ENTREGUE";
      mensagem: string;
    };

/** Contrato: dado o que o aluno apresentou (texto digitado ou QR lido), confirma a entrega. */
export interface ConfirmacaoDeRetirada {
  confirmar(entrada: string): ResultadoRetirada;
}

const PADRAO_CODIGO = /CNT-[A-Z0-9]{4,}/i;

function finalizar(repo: RepositorioRetirada, codigo: string): ResultadoRetirada {
  const pedido = repo.buscarPorCodigo(codigo);
  if (!pedido) return { ok: false, motivo: "NAO_ENCONTRADO", mensagem: `Pedido ${codigo} não encontrado.` };
  if (pedido.status === "ENTREGUE")
    return { ok: false, motivo: "JA_ENTREGUE", mensagem: `O pedido ${codigo} já foi entregue.` };
  if (pedido.status !== "PRONTO")
    return { ok: false, motivo: "NAO_PRONTO", mensagem: `O pedido ${codigo} ainda não está pronto.` };
  repo.marcarEntregue(pedido.id);
  return { ok: true, pedidoId: pedido.id, codigo: pedido.codigo };
}

/** Implementação da Entrega 1: a atendente digita/confere o código. */
export class ConfirmacaoPorCodigo implements ConfirmacaoDeRetirada {
  constructor(private readonly repo: RepositorioRetirada) {}
  confirmar(entrada: string): ResultadoRetirada {
    const codigo = entrada.trim().toUpperCase();
    if (!new RegExp(`^${PADRAO_CODIGO.source}$`, "i").test(codigo))
      return { ok: false, motivo: "FORMATO_INVALIDO", mensagem: "Código inválido. Use o formato CNT-XXXX." };
    return finalizar(this.repo, codigo);
  }
}

/** Implementação nova: o tablet lê o QR Code. O conteúdo pode ser só o código ou uma URL/JSON que o contenha. */
export class ConfirmacaoPorQrCode implements ConfirmacaoDeRetirada {
  constructor(private readonly repo: RepositorioRetirada) {}
  confirmar(entrada: string): ResultadoRetirada {
    const m = PADRAO_CODIGO.exec(entrada);
    if (!m) return { ok: false, motivo: "FORMATO_INVALIDO", mensagem: "QR Code não é de um pedido da CantiNet." };
    return finalizar(this.repo, m[0].toUpperCase());
  }
}