/**
 * Contrato de uma estação da cozinha (OCP + Liskov + composição).
 * Para criar uma estação nova basta implementar esta interface
 * e registrá-la na lista usada pela Cozinha. Nenhum outro arquivo muda.
 */
export interface ProdutoPreparavel {
  id: string;
  nome: string;
  /** Texto livre: "FORNO", "CHAPA", "BALCAO", "SUCO_NATURAL"... */
  categoria: string;
  tempoPreparoMin: number;
}

export interface Estacao {
  readonly id: string;
  readonly nome: string;
  /** Categoria de produto que esta estação atende. */
  readonly categoria: string;
  /** Quantas unidades podem ser preparadas ao mesmo tempo. */
  readonly bancadas: number;
  /** Minutos de preparo de uma unidade. 0 = sem preparo (não entra na linha do tempo). */
  tempoPreparo(produto: ProdutoPreparavel): number;
}
