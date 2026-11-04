export interface DadosEstorno {
  /** Valor em reais. */
  valor: number;
  ultimos4: string;
  /** Opcional: quando o pagamento falha antes de existir pedido, não há código. */
  codigoPedido?: string;
  prazoDiasUteis?: number;
}

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ");
}

/** Mensagem mostrada ao aluno quando um valor pago é devolvido ao cartão. */
export function mensagemEstorno({ valor, ultimos4, codigoPedido, prazoDiasUteis = 5 }: DadosEstorno): string {
  const prazo = prazoDiasUteis === 1 ? "1 dia útil" : `${prazoDiasUteis} dias úteis`;
  const pedido = codigoPedido ? ` do pedido ${codigoPedido}` : "";
  return `Estorno de ${formatarReais(valor)}${pedido} solicitado ao cartão final ${ultimos4}. O valor aparece na fatura em até ${prazo}.`;
}