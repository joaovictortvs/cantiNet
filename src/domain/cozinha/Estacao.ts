/**
 * Contrato de uma estação da cozinha (OCP + Liskov + composição).
 * Para criar uma estação nova basta implementar esta interface
 * e registrá-la em criarEstacoesPadrao(). Nenhum outro arquivo muda.
 */
export interface ProdutoPreparavel {
  id: string;
  nome: string;
  /** "FORNO", "CHAPA", "PRONTA_ENTREGA", "SUCO_NATURAL"... */
  categoria: string;
  tempoPreparoMin: number;
}

export interface Estacao {
  readonly id: string;
  readonly nome: string;
  /** Categoria de produto que esta estação atende. */
  readonly categoria: string;
  /** Quantas tarefas podem rodar ao mesmo tempo (bandejas, chapas...). */
  readonly bancadas: number;
  /** Se o aluno espera o preparo (padrão: sim). O balcão de pronta-entrega só separa: não há o que "manter aquecido". */
  readonly requerPreparo?: boolean;
  /** Minutos de preparo de um item. Valores <= 0 fazem o item não entrar na linha do tempo. */
  tempoPreparo(produto: ProdutoPreparavel): number;
  /** Texto da tarefa na tela. Padrão: a lista dos itens, ex.: "2× Coxinha, 1× Empada". */
  descricaoTarefa?(itens: string): string;
  /** Nome da bancada. Padrão: "<nome> 1", "<nome> 2"... (ou só o nome se houver uma). */
  rotuloBancada?(indice: number): string;
}