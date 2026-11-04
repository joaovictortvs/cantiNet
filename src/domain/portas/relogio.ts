/** O domínio pergunta "que horas são?" sem saber de onde a resposta vem (DIP). */
export interface Relogio {
  /** Minuto do dia (0–1439), já com o adiantamento da demonstração. */
  agoraEmMin(): number;
  /** Data de hoje (para validar a validade do cartão). */
  hoje(): Date;
}

/** Relógio que a demonstração pode adiantar. */
export interface RelogioAjustavel extends Relogio {
  adiantar(minutos: number): void;
}
