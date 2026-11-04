/** Resultado de uma operação que pode falhar por motivo de negócio (sem lançar exceção). */
export interface Sucesso<T> {
  readonly ok: true;
  readonly valor: T;
}

export interface Falha {
  readonly ok: false;
  readonly erro: string;
  /** Código opcional para quem precisa reagir a um tipo específico de falha. */
  readonly codigo?: string;
}

export type Resultado<T> = Sucesso<T> | Falha;

export function sucesso<T>(valor: T): Sucesso<T> {
  return { ok: true, valor };
}

export function falha(erro: string, codigo?: string): Falha {
  return codigo === undefined ? { ok: false, erro } : { ok: false, erro, codigo };
}
