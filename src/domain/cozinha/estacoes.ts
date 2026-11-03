import type { Estacao, ProdutoPreparavel } from "./Estacao";

export class Forno implements Estacao {
  readonly id = "forno";
  readonly nome = "Forno";
  readonly categoria = "FORNO";
  readonly bancadas = 2; // 2 bandejas
  tempoPreparo(produto: ProdutoPreparavel): number {
    return produto.tempoPreparoMin;
  }
}

export class Chapa implements Estacao {
  readonly id = "chapa";
  readonly nome = "Chapa";
  readonly categoria = "CHAPA";
  readonly bancadas = 2; // 2 chapas
  tempoPreparo(produto: ProdutoPreparavel): number {
    return produto.tempoPreparoMin;
  }
}

/** Pronta-entrega: não tem preparo, então nunca aparece na linha do tempo. */
export class Balcao implements Estacao {
  readonly id = "balcao";
  readonly nome = "Balcão";
  readonly categoria = "BALCAO";
  readonly bancadas = Number.POSITIVE_INFINITY;
  tempoPreparo(): number {
    return 0;
  }
}

/** A estação nova da Entrega 2: só esta classe + uma linha no registro. */
export class Liquidificador implements Estacao {
  readonly id = "liquidificador";
  readonly nome = "Liquidificador";
  readonly categoria = "SUCO_NATURAL";
  readonly bancadas = 1;
  tempoPreparo(produto: ProdutoPreparavel): number {
    return produto.tempoPreparoMin > 0 ? produto.tempoPreparoMin : 3;
  }
}

/** Registro único (composition root). Adicionar estação = adicionar uma linha aqui. */
export function criarEstacoesPadrao(): Estacao[] {
  return [new Forno(), new Chapa(), new Balcao(), new Liquidificador()];
}
