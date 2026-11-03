export interface DadosEstorno {
  /** Valor em reais. */
  valor: number;
  ultimos4: string;
  codigoPedido: string;
  prazoDiasUteis?: number;
}

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ");
}

/** Mensagem mostrada ao aluno quando um pedido pago é cancelado. */
export function mensagemEstorno({ valor, ultimos4, codigoPedido, prazoDiasUteis = 5 }: DadosEstorno): string {
  const prazo = prazoDiasUteis === 1 ? "1 dia útil" : `${prazoDiasUteis} dias úteis`;
  return `Estorno de ${formatarReais(valor)} do pedido ${codigoPedido} solicitado ao cartão final ${ultimos4}. O valor aparece na fatura em até ${prazo}.`;
}
