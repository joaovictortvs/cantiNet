/** Gera o código curto do pedido (CNT-XXXX). Porta para testar com códigos previsíveis. */
export interface GeradorDeCodigos {
  proximo(): string;
}
