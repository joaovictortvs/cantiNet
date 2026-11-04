import type { DadosCartao, Resultado, ResultadoRetirada } from './visoes';

/**
 * Operações separadas por PAPEL (Segregação de Interfaces): cada tela recebe só as que usa.
 * O aluno nunca enxerga "repor estoque"; a atendente nunca enxerga "pagar".
 */
export interface OperacoesDoCarrinho {
  adicionar(produtoId: string): void;
  alterarQuantidade(produtoId: string, delta: number): void;
  escolherHorario(minuto: number | null): void;
}

export interface OperacoesDePagamento {
  cadastrarCartao(dados: DadosCartao): Resultado<true>;
  removerCartao(): void;
  pagar(): Promise<Resultado<true>>;
}

export interface OperacoesDaCozinha {
  avancarPedido(pedidoId: string): void;
  /** `forma`: 'qrcode' (câmera) ou 'codigo' (digitado). */
  confirmarRetirada(forma: string, entrada: string): ResultadoRetirada;
}

export interface OperacoesDeEstoque {
  reporEstoque(produtoId: string, quantidade: number): void;
}

export interface FerramentasDeDemonstracao {
  adiantarRelogio(minutos: number): void;
  gerarPedidosDeDemonstracao(): void;
  reiniciar(): void;
}
