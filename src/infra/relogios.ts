import type { RelogioAjustavel } from '../domain/portas/relogio';

/** Relógio do sistema com adiantamento opcional (usado pelo botão "+5 min" da demonstração). */
export class RelogioDoSistema implements RelogioAjustavel {
  #adiantadoEmMin = 0;

  agoraEmMin(): number {
    const agora = new Date();
    return agora.getHours() * 60 + agora.getMinutes() + this.#adiantadoEmMin;
  }

  hoje(): Date {
    return new Date();
  }

  adiantar(minutos: number): void {
    this.#adiantadoEmMin += minutos;
  }
}

/** Relógio de mentira para testes: hora e data escolhidas por quem testa. */
export class RelogioFixo implements RelogioAjustavel {
  constructor(
    private minuto: number,
    private data: Date = new Date(2026, 10, 3),
  ) {}

  agoraEmMin(): number {
    return this.minuto;
  }

  hoje(): Date {
    return this.data;
  }

  adiantar(minutos: number): void {
    this.minuto += minutos;
  }
}
